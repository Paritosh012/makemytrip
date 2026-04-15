// models/user.model.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // only fetched when explicitly needed
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "HOST", "END_USER", "ADMIN"],
      default: "END_USER",
    },
    permissions: [
      {
        type: String,
        enum: [
          "VIEW_USERS",
          "EDIT_USERS",
          "DELETE_USERS",
          "VIEW_TENANTS",
          "MANAGE_TENANTS",
          "APPROVE_HOSTS",
        ],
      },
    ],

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
