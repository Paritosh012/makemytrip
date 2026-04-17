const mongoose = require("mongoose");
const subscriptionModel = require("../models/subscription.model");
const packageModel = require("../models/package.model");
const bookingModel = require("../models/booking.model");

// =============================
// CREATE BOOKING
// =============================
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { packageId, seats } = req.body;
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      throw new Error("Invalid packageId");
    }

    if (!seats || seats < 1) {
      throw new Error("Invalid seat count");
    }

    const pkg = await packageModel.findById(packageId).session(session);

    if (!pkg) throw new Error("Package not found");
    if (pkg.status !== "ACTIVE") throw new Error("Package not available");

    const tenantId = pkg.tenantId;

    // ✅ Check HOST's subscription (not end user's)
    const subscription = await subscriptionModel.findOne({
      tenantId,
      status: "ACTIVE",
    });

    if (!subscription) {
      throw new Error("This tour operator has no active subscription");
    }

    // ✅ Only enforce limit if maxBookingsPerMonth is actually set
    if (
      subscription.maxBookingsPerMonth != null &&
      subscription.maxBookingsPerMonth > 0
    ) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // ✅ Count ALL non-cancelled bookings (PENDING + CONFIRMED)
      const bookingCount = await bookingModel
        .countDocuments({
          tenantId,
          status: { $in: ["PENDING", "CONFIRMED"] },
          createdAt: { $gte: startOfMonth },
        })
        .session(session);

      if (bookingCount >= subscription.maxBookingsPerMonth) {
        throw new Error("Monthly booking limit reached for this operator");
      }
    }

    // ✅ Check seats available
    if (pkg.seatsAvailable < seats) {
      throw new Error("Not enough seats available");
    }

    const booking = await bookingModel.create(
      [
        {
          tenantId,
          packageId,
          userId,
          status: "PENDING",
          paymentStatus: "PENDING",
          price: pkg.price * seats,
          seats,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message || "Booking failed",
    });
  }
};

// =============================
// CANCEL BOOKING
// =============================
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // ✅ Ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Booking already cancelled" });
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Invalid booking state" });
    }

    const pkg = await packageModel.findById(booking.packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    if (pkg.startDate && new Date() > new Date(pkg.startDate)) {
      return res.status(400).json({ success: false, message: "Cannot cancel after trip starts" });
    }

    // ✅ Payment status update
    if (booking.paymentStatus === "SUCCESS") {
      booking.paymentStatus = "REFUNDED";
    } else {
      // PENDING payment → just mark failed (no money moved)
      booking.paymentStatus = "FAILED";
    }

    // ✅ Restore seats whenever booking had confirmed payment OR was just pending
    // Seats were never deducted on PENDING (deduction happens on verify),
    // so only restore if payment was SUCCESS (now REFUNDED)
    if (booking.paymentStatus === "REFUNDED") {
      pkg.seatsAvailable += booking.seats;
      await pkg.save();
    }

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    await booking.save();

    return res.json({
      success: true,
      message:
        booking.paymentStatus === "REFUNDED"
          ? "Booking cancelled and refund simulated"
          : "Booking cancelled",
    });
  } catch (error) {
    console.error("CANCEL ERROR:", error);
    return res.status(500).json({ success: false, message: "Cancel booking failed" });
  }
};

// =============================
// GET BOOKINGS
// =============================
const getBookings = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({ userId: req.user.userId })
      .populate("packageId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

module.exports = { createBooking, cancelBooking, getBookings };