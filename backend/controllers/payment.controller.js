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

    // prevent multiple orders
    if (booking.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order already created",
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

    // ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // already confirmed (idempotency - simple version)
    if (booking.status === "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Booking already confirmed",
      });
    }

    // verify signature
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

    // confirm booking
    await confirmBookingInternal(booking._id);

    // store payment
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paymentStatus = "SUCCESS";
    booking.isPaymentVerified = true;
    booking.paymentVerifiedAt = new Date();

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
