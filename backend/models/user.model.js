// models/user.model.js

const mongoose = require("mongoose");

const PERMISSIONS = require("../config/permissions");

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
      select: false,
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
    // Enum pulled from config/permissions.js so there is ONE source of truth.
    // Previously this list was missing MANAGE_USERS while admin.routes.js
    // required it — meaning that permission could never be saved, and every
    // /api/admin/users write was permanently 403 for non-SUPER_ADMINs.
    permissions: [
      {
        type: String,
        enum: PERMISSIONS,
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
