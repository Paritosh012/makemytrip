const mongoose = require("mongoose");
const subscriptionModel = require("../models/subscription.model");
const packageModel = require("../models/package.model");
const bookingModel = require("../models/booking.model");

const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { packageId } = req.body;
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid packageId",
      });
    }

    const pkg = await packageModel
      .findOne({
        _id: packageId,
      })
      .session(session);

    if (!pkg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (pkg.status !== "ACTIVE") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Package is not available",
      });
    }

    if (pkg.seatsAvailable <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "No seats available",
      });
    }

    const tenantId = pkg.tenantId;

    const subscription = await subscriptionModel.findOne({
      tenantId: pkg.tenantId,
      status: "ACTIVE",
    });

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "No active subscription",
      });
    }

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
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "Monthly booking limit reached",
      });
    }

    const booking = await bookingModel.create(
      [
        {
          tenantId,
          packageId,
          userId,
          status: "PENDING",
          price: pkg.price,
        },
      ],
      { session },
    );

    pkg.seatsAvailable -= 1;
    await pkg.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Booking failed",
    });
  }
};

const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { bookingId } = req.params;
    const { userId, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid bookingId",
      });
    }

    const booking = await bookingModel.findById(bookingId).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 🔒 Ownership check
    if (role === "END_USER" && booking.userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Not allowed to cancel this booking",
      });
    }

    // ❌ Already cancelled
    if (booking.status === "CANCELLED") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    // ❌ Invalid states
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Cannot cancel this booking",
      });
    }

    // 🔥 Restore seats ONLY if confirmed
    if (booking.status === "CONFIRMED") {
      const pkg = await packageModel.findByIdAndUpdate(
        booking.packageId,
        {
          $inc: { seatsAvailable: booking.seats || 1 },
        },
        { session },
      );

      if (!pkg) {
        throw new Error("Package not found while restoring seats");
      }
    }

    // ✅ Update booking
    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Cancel Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Cancel booking failed",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({ userId: req.user._id })
      .populate("packageId"); // 🔥 IMPORTANT

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
