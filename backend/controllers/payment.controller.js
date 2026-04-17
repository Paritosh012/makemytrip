const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Booking = require("../models/booking.model");
const Package = require("../models/package.model");

// =============================
// CREATE ORDER
// =============================
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking is not in PENDING state" });
    }

    // ✅ Ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Reuse existing order if already created (idempotent)
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

    return res.json({ success: true, order });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

// =============================
// VERIFY PAYMENT
// =============================
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // ✅ Ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Idempotency
    if (booking.status === "CONFIRMED" && booking.isPaymentVerified) {
      return res.json({ success: true, message: "Already confirmed" });
    }

    // ✅ Signature verification
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      booking.paymentStatus = "FAILED";
      await booking.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // ✅ Check seats still available before confirming
    const pkg = await Package.findById(booking.packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    if (pkg.seatsAvailable < booking.seats) {
      booking.paymentStatus = "FAILED";
      await booking.save();
      return res.status(400).json({ success: false, message: "Seats no longer available" });
    }

    // ✅ Deduct seats
    pkg.seatsAvailable -= booking.seats;
    await pkg.save();

    // ✅ Confirm booking
    booking.status            = "CONFIRMED";
    booking.paymentStatus     = "SUCCESS";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.isPaymentVerified = true;
    booking.paymentVerifiedAt = new Date();
    booking.confirmedAt       = new Date();
    await booking.save();

    return res.json({ success: true, message: "Payment verified & booking confirmed" });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Verification failed" });
  }
};

module.exports = { createOrder, verifyPayment };