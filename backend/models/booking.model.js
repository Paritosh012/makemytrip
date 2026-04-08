const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔥 Booking lifecycle
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // 💰 Price snapshot
    price: {
      type: Number,
      required: true,
    },

    // 🎟️ Seats
    seats: {
      type: Number,
      default: 1,
    },

    // 💳 Payment fields (MANDATORY)
    razorpayOrderId: {
      type: String,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    isPaymentVerified: {
      type: Boolean,
      default: false,
    },

    // ⏱️ Lifecycle timestamps
    cancelledAt: Date,
    confirmedAt: Date,
    paymentVerifiedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
