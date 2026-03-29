const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Package = require("../models/package.model");

const confirmBookingInternal = async (bookingId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);

    if (!booking || booking.status !== "PENDING") {
      throw new Error("Invalid booking");
    }

    // 🔥 ATOMIC seat decrement
    const pkg = await Package.findOneAndUpdate(
      {
        _id: booking.packageId,
        seatsAvailable: { $gt: 0 },
      },
      {
        $inc: { seatsAvailable: -1 },
      },
      { new: true, session }
    );

    if (!pkg) {
      throw new Error("No seats available");
    }

    // ✅ Update booking
    booking.status = "CONFIRMED";
    booking.confirmedAt = new Date();

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


module.exports = {
  confirmBookingInternal,
};