const mongoose = require("mongoose");
const crypto = require("crypto");
const getRazorpay = require("../config/razorpay");
const Booking = require("../models/booking.model");
const Package = require("../models/package.model");

// =============================
// CREATE ORDER
// =============================
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId required" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Booking is not in PENDING state" });
    }

    // ✅ Ownership check
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Reuse existing order if already created (idempotent)
    if (booking.razorpayOrderId) {
      console.log(
        `♻️ Reusing existing order: ${booking.razorpayOrderId} for booking ${bookingId}`,
      );
      return res.json({
        success: true,
        order: {
          id: booking.razorpayOrderId,
          amount: booking.price * 100,
          currency: "INR",
        },
      });
    }

    // 🔥 DEBUG: Check if Razorpay keys exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ RAZORPAY KEYS MISSING IN PRODUCTION!");
      console.error(
        "   RAZORPAY_KEY_ID:",
        process.env.RAZORPAY_KEY_ID ? "SET ✓" : "❌ MISSING",
      );
      console.error(
        "   RAZORPAY_KEY_SECRET:",
        process.env.RAZORPAY_KEY_SECRET ? "SET ✓" : "❌ MISSING",
      );
      return res.status(500).json({
        success: false,
        message: "Payment service not configured. Contact support.",
      });
    }

    console.log(
      `📦 Creating Razorpay order for booking ${bookingId}, amount: ₹${booking.price}`,
    );

    // ✅ Create order with description & metadata
    const order = await getRazorpay().orders.create({
      amount: booking.price * 100, // amount in paise
      currency: "INR",
      receipt: booking._id.toString(),
      description: `Travel Booking - Package: ${booking.packageId}`,
      notes: {
        bookingId: booking._id.toString(),
        userId: booking.userId.toString(),
      },
    });

    console.log(`✅ Order created: ${order.id}, Amount: ₹${booking.price}`);

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.json({ success: true, order });
  } catch (err) {
    console.error("❌ CREATE ORDER ERROR:");
    console.error("   Type:", err.constructor.name);
    console.error("   Message:", err.message);
    console.error("   Status:", err.statusCode);

    // 🔥 Handle specific Razorpay errors
    if (err.statusCode === 406) {
      console.error(
        "   ⚠️ 406 Not Acceptable - Razorpay API request format issue",
      );
      return res.status(500).json({
        success: false,
        message: "Payment API error (406). Retrying may help.",
      });
    }

    if (err.statusCode === 401 || err.message.includes("Unauthorized")) {
      console.error("   🔑 401 Unauthorized - Razorpay keys invalid/expired");
      return res.status(500).json({
        success: false,
        message: "Payment authentication failed. Invalid keys.",
      });
    }

    if (err.statusCode === 400) {
      console.error("   ⚠️ 400 Bad Request - Check request parameters");
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid payment request",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Order creation failed",
    });
  }
};

// =============================
// VERIFY PAYMENT
// =============================
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment fields" });
    }

    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // ✅ Ownership
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Idempotency — if already confirmed, return success
    if (booking.status === "CONFIRMED" && booking.isPaymentVerified) {
      console.log(
        `♻️ Booking ${booking._id} already confirmed. Returning success.`,
      );
      return res.json({ success: true, message: "Already confirmed" });
    }

    // ✅ Signature verification
    console.log(
      `🔐 Verifying payment signature for order: ${razorpay_order_id}`,
    );

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.error(`❌ Signature mismatch for order ${razorpay_order_id}`);
      booking.paymentStatus = "FAILED";
      await booking.save();
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    console.log(`✅ Signature verified for payment: ${razorpay_payment_id}`);

    // ✅ ATOMIC seat decrement — prevents race condition
    // Uses findOneAndUpdate with $inc so two concurrent payments
    // can never both succeed when only 1 seat remains.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const pkg = await Package.findOneAndUpdate(
        {
          _id: booking.packageId,
          seatsAvailable: { $gte: booking.seats },
        },
        {
          $inc: { seatsAvailable: -booking.seats },
        },
        { new: true, session },
      );

      if (!pkg) {
        await session.abortTransaction();
        session.endSession();

        console.error(
          `❌ Atomic seat decrement failed — not enough seats for booking ${booking._id}`,
        );
        booking.paymentStatus = "FAILED";
        await booking.save();
        return res
          .status(400)
          .json({ success: false, message: "Seats no longer available" });
      }

      console.log(
        `📉 Atomically decremented ${booking.seats} seat(s) — ${pkg.seatsAvailable} remaining`,
      );

      // ✅ Confirm booking inside the same transaction
      booking.status = "CONFIRMED";
      booking.paymentStatus = "SUCCESS";
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.isPaymentVerified = true;
      booking.paymentVerifiedAt = new Date();
      booking.confirmedAt = new Date();
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (txnErr) {
      await session.abortTransaction();
      session.endSession();
      throw txnErr;
    }

    console.log(`🎉 Booking ${booking._id} confirmed successfully!`);

    return res.json({
      success: true,
      message: "Payment verified & booking confirmed",
    });
  } catch (err) {
    console.error("❌ VERIFY PAYMENT ERROR:");
    console.error("   Type:", err.constructor.name);
    console.error("   Message:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message || "Verification failed",
    });
  }
};

module.exports = { createOrder, verifyPayment };
