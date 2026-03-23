const Booking = require("../models/booking.model");

const createBooking = async (req, res) => {
  try {
    const { packageId } = req.body;

    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const subscription = req.subscription;

    // 🔥 STEP 1: COUNT CURRENT MONTH BOOKINGS
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bookingCount = await Booking.countDocuments({
      tenantId,
      createdAt: { $gte: startOfMonth },
    });

    // 🔥 STEP 2: ENFORCE LIMIT
    if (bookingCount >= subscription.maxBookingsPerMonth) {
      return res.status(403).json({
        success: false,
        message: "Monthly booking limit reached",
      });
    }

    // 🔥 STEP 3: CREATE BOOKING
    const booking = await Booking.create({
      tenantId,
      packageId,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Booking failed",
    });
  }
};

module.exports = {
  createBooking,
};
