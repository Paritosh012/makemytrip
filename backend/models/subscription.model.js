const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      required: true,
      enum: ["BASIC", "PRO", "PREMIUM"],
    },
    maxAgents: { 
      type: Number,
      required: true,
    },
    maxBookingsPerMonth: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    }, 
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
