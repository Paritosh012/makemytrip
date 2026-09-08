const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
  ACCESS_MAX_AGE_MS,
  REFRESH_MAX_AGE_MS,
  SETUP_MAX_AGE_MS,
} = require("../config/cookies");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const SETUP_TOKEN_TTL = "10m";

const ACCESS_TOKEN_TTL_MS = ACCESS_MAX_AGE_MS;
const REFRESH_TOKEN_TTL_MS = REFRESH_MAX_AGE_MS;
const SETUP_TOKEN_TTL_MS = SETUP_MAX_AGE_MS;

/**
 * Secrets are read lazily so dotenv is guaranteed to have run.
 * JWT_SECRET is kept as a fallback so an existing deploy does not hard-crash
 * if the new env vars have not been added yet — but the `type` claim below
 * still stops a refresh token from being replayed as an access token.
 */
const getSecret = (name) => {
  const secret = process.env[name] || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(`Missing ${name} (and no JWT_SECRET fallback) in env`);
  }

  if (!process.env[name] && process.env.NODE_ENV !== "test") {
    console.warn(`[auth] ${name} not set — falling back to JWT_SECRET`);
  }

  return secret;
};

const getAccessSecret = () => getSecret("JWT_ACCESS_SECRET");
const getRefreshSecret = () => getSecret("JWT_REFRESH_SECRET");

// ================= SIGNING =================

/**
 * The access token carries the authorisation claims (role, tenantId,
 * permissions) so protected routes need zero DB round-trips.
 *
 * `type: "access"` is the guard that stops a refresh or setup token from being
 * handed to the protect middleware and accepted.
 */
const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      permissions: user.permissions || [],
      type: "access",
    },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_TTL },
  );

/**
 * The refresh token is deliberately thin — no role, no permissions. It is only
 * an identity pointer. Everything authoritative is re-read from the DB on
 * refresh, which is how a demoted user loses their permissions within 15
 * minutes instead of 7 days.
 */
const signRefreshToken = ({ userId, tokenId }) =>
  jwt.sign(
    {
      userId: userId.toString(),
      tokenId,
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_TTL },
  );

/**
 * Purpose-scoped, single-job token issued ONLY after a successful OTP check.
 * It is the proof that /set-password demands. This is the fix for the account
 * takeover bug.
 */
const signSetupToken = (userId) =>
  jwt.sign(
    {
      userId: userId.toString(),
      type: "setup",
      purpose: "set_password",
    },
    getAccessSecret(),
    { expiresIn: SETUP_TOKEN_TTL },
  );

// ================= VERIFICATION =================

const verifyTyped = (token, secret, expectedType) => {
  const payload = jwt.verify(token, secret);

  if (payload.type !== expectedType) {
    const err = new Error(`Expected ${expectedType} token`);
    err.name = "InvalidTokenTypeError";
    throw err;
  }

  return payload;
};

const verifyAccessToken = (token) =>
  verifyTyped(token, getAccessSecret(), "access");

const verifyRefreshToken = (token) =>
  verifyTyped(token, getRefreshSecret(), "refresh");

const verifySetupToken = (token) => {
  const payload = verifyTyped(token, getAccessSecret(), "setup");

  if (payload.purpose !== "set_password") {
    const err = new Error("Wrong token purpose");
    err.name = "InvalidTokenTypeError";
    throw err;
  }

  return payload;
};

// ================= HELPERS =================

const newTokenId = () => crypto.randomUUID();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Constant-time compare. Overkill for a SHA-256 hex digest, but it costs one
 * line and removes any timing side channel from the comparison.
 */
const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signSetupToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySetupToken,
  newTokenId,
  hashToken,
  timingSafeEqual,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  SETUP_TOKEN_TTL,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  SETUP_TOKEN_TTL_MS,
};
