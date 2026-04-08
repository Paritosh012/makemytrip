const { confirmBookingInternal } = require("../config/booking.service");
const razorpay = require("../config/razorpay");
const Booking = require("../models/booking.model");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking",
      });
    }

    // ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (booking.razorpayOrderId) {
      return res.json({
        success: true,
        order: {
          id: booking.razorpayOrderId,
          amount: booking.price * 100,
          currency: "INR",
        },
      });
    }

    const order = await razorpay.orders.create({
      amount: booking.price * 100,
      currency: "INR",
      receipt: booking._id.toString(),
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔥 idempotency
    if (booking.status === "CONFIRMED") {
      return res.json({
        success: true,
        message: "Already confirmed",
      });
    }

    // 🔐 signature verify
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment",
      });
    }

    // =========================
    // 🔥 SEAT DEDUCTION (CORRECT PLACE)
    // =========================
    const pkg = await require("../models/package.model").findById(
      booking.packageId,
    );

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (pkg.seatsAvailable < booking.seats) {
      return res.status(400).json({
        success: false,
        message: "Seats no longer available",
      });
    }

    // deduct seats
    pkg.seatsAvailable -= booking.seats;
    await pkg.save();

    // =========================
    // 🔥 CONFIRM BOOKING
    // =========================
    booking.status = "CONFIRMED";
    booking.paymentStatus = "SUCCESS";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.isPaymentVerified = true;
    booking.paymentVerifiedAt = new Date();
    booking.confirmedAt = new Date();

    await booking.save();

    return res.json({
      success: true,
      message: "Payment verified & booking confirmed",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Verification failed",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
