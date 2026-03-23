const mongoose = require("mongoose");

const hostApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
 
    agencyName: {
      type: String,
      required: true,
    },
 
    businessEmail: {
      type: String,
      required: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

hostApplicationSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  },
);

module.exports = mongoose.model("HostApplication", hostApplicationSchema);
