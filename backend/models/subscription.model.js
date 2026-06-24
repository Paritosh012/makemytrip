const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    plan: {
      type: String,
      required: true,
      enum: ["BASIC", "PRO", "PREMIUM"],
    },
    maxAgents: {
      type: Number,
      default: null,
    },
    maxBookingsPerMonth: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "CANCELLED", "EXPIRED"],
      default: "PENDING",
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
