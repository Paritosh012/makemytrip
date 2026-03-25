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

    // 🔥 CRITICAL: Booking lifecycle
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // 💰 Snapshot price (DON’T depend on package later)
    price: {
      type: Number,
      required: true,
    },

    // 🎟️ Seat count (future-proofing)
    seats: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ⏱️ Optional lifecycle timestamps
    cancelledAt: Date,
    confirmedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);