const mongoose = require("mongoose");
const subscriptionModel = require("../models/subscription.model");
const packageModel = require("../models/package.model");
const bookingModel = require("../models/booking.model");
const razorpay = require("../config/razorpay");

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

    const subscription = await subscriptionModel.findOne({
      tenantId,
      status: "ACTIVE",
    });

    if (!subscription) throw new Error("No active subscription");

    // monthly limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bookingCount = await bookingModel
      .countDocuments({
        tenantId,
        status: "CONFIRMED",
        createdAt: { $gte: startOfMonth },
      })
      .session(session);

    if (bookingCount >= subscription.maxBookingsPerMonth) {
      throw new Error("Monthly booking limit reached");
    }

    // ✅ CREATE ONLY (NO SEAT CHANGE)
    const booking = await bookingModel.create(
      [
        {
          tenantId,
          packageId,
          userId,
          status: "PENDING",
          price: pkg.price * seats,
          seats,
        },
      ],
      { session },
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

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log("=== CANCEL START ===", bookingId);

    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ Ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ❌ Prevent double cancel
    if (booking.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    // ❌ Invalid states
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking state",
      });
    }

    // ✅ Get package
    const pkg = await packageModel.findById(booking.packageId);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // ❌ Cannot cancel after trip starts
    if (pkg.startDate && new Date() > pkg.startDate) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel after trip starts",
      });
    }

    // =========================
    // 🔥 MOCK REFUND LOGIC
    // =========================
    if (booking.paymentStatus === "SUCCESS") {
      booking.paymentStatus = "REFUNDED";
    } else if (booking.paymentStatus === "PENDING") {
      booking.paymentStatus = "FAILED";
    }

    // =========================
    // 🔥 RESTORE SEATS
    // =========================
    if (booking.paymentStatus === "REFUNDED") {
      pkg.seatsAvailable += booking.seats;
      await pkg.save();
    }

    // =========================
    // 🔥 FINAL STATE
    // =========================
    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();

    await booking.save();

    console.log("=== CANCEL SUCCESS ===");

    return res.json({
      success: true,
      message: "Booking cancelled (mock refund applied)",
    });
  } catch (error) {
    console.error("CANCEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Cancel booking failed",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({ userId: req.user.userId })
      .populate("packageId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

module.exports = {
  createBooking,
  cancelBooking,
  getBookings,
};
