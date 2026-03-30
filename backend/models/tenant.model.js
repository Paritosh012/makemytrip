const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Tenant", tenantSchema);
