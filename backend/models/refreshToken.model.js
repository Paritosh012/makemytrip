const mongoose = require("mongoose");

/**
 * One document = one issued refresh token = one device/session.
 *
 * We store a SHA-256 hash of the token, never the token itself — same reason
 * we hash passwords. If the DB leaks, the attacker gets hashes, not usable
 * sessions.
 *
 * Rotation trail: when a token is used, it is revoked and `replacedByTokenId`
 * points at its successor. That chain is what makes reuse detection possible.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Public identifier embedded in the JWT payload. Lets us look up the row
    // without scanning by hash.
    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    // "rotated" | "logout" | "logout_all" | "reuse_detected" | "hash_mismatch"
    revokedReason: {
      type: String,
      default: null,
    },

    replacedByTokenId: {
      type: String,
      default: null,
    },

    // Useful for a future "active sessions" screen and for audit.
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true },
);

// MongoDB deletes the document once expiresAt passes, so the collection does
// not grow forever. Expired tokens fail jwt.verify() long before this anyway.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast path for "revoke every live session for this user".
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

module.exports =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", refreshTokenSchema);
