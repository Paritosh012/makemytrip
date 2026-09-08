const rateLimit = require("express-rate-limit");

/**
 * ⚠️ REQUIRED IN app.js — put this BEFORE any limiter is mounted:
 *
 *     app.set("trust proxy", 1);
 *
 * Render sits behind a proxy, so without it every request looks like it came
 * from the same proxy IP. One user hitting the login form would then rate-limit
 * the entire planet.
 */

const isTest = () => process.env.NODE_ENV === "test";

const MINUTE = 60 * 1000;

/**
 * Shared defaults.
 *
 * standardHeaders: "draft-7" sends the modern RateLimit-* headers so the
 * frontend can read how many attempts are left instead of guessing.
 * legacyHeaders: false drops the deprecated X-RateLimit-* duplicates.
 */
const baseConfig = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Jest fires dozens of requests in milliseconds — without this your own
  // test suite trips the limiter and you spend an hour debugging a 429.
  skip: () => isTest(),
};

const limitResponse = (message) => (req, res) =>
  res.status(429).json({
    success: false,
    message,
    code: "RATE_LIMITED",
  });

/**
 * AUTH LIMITER — register / login / verify-otp / resend-otp / set-password.
 *
 * Tight on purpose. These are the endpoints a credential-stuffing script
 * hammers, and a real human never needs 10 login attempts in 15 minutes.
 *
 * Note this is IP-based, so it does NOT stop a distributed attack from a
 * botnet. The per-account defences are the ones that actually protect a
 * specific user: the OTP attempts counter (5) and the 30s resend cooldown.
 * Layered, not either/or.
 */
const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * MINUTE,
  limit: 10,
  handler: limitResponse(
    "Too many attempts from this IP. Please try again in 15 minutes.",
  ),
});

/**
 * OTP LIMITER — stricter, for the endpoints that trigger an outbound email.
 *
 * Every hit here costs real money and burns Brevo quota. Mount this on
 * /register and /resend-otp instead of authLimiter if you want the tighter cap.
 */
const otpLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * MINUTE,
  limit: 5,
  handler: limitResponse("Too many OTP requests. Please try again in an hour."),
});

/**
 * GLOBAL API LIMITER — mount once in app.js:
 *
 *     app.use("/api", apiLimiter);
 *
 * Generous. This is a blunt instrument against scrapers, not a security
 * control. Real browsing never comes close to 300 requests in 15 minutes.
 */
const apiLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * MINUTE,
  limit: 300,
  handler: limitResponse("Too many requests. Please slow down."),
});

/**
 * PAYMENT LIMITER — Razorpay order creation.
 *
 * Each order hits Razorpay's API and writes a DB row. Nobody legitimately
 * creates 20 orders a minute.
 */
const paymentLimiter = rateLimit({
  ...baseConfig,
  windowMs: 10 * MINUTE,
  limit: 20,
  handler: limitResponse(
    "Too many payment attempts. Please wait a few minutes.",
  ),
});

module.exports = {
  authLimiter,
  otpLimiter,
  apiLimiter,
  paymentLimiter,
};
