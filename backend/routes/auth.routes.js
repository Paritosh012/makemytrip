const express = require("express");

const {
  register,
  verifyOtp,
  resendOtp,
  setPassword,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

// ⚠️ ADJUST THIS PATH to wherever authLimiter actually lives in your repo.
const { authLimiter } = require("../middlewares/rateLimiter.middleware");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/resend-otp", authLimiter, resendOtp);
router.post("/set-password", authLimiter, setPassword);
router.post("/login", authLimiter, login);

// Deliberately NOT behind authLimiter: a busy tab legitimately refreshes every
// 15 minutes, and a rate-limited refresh would log real users out.
router.post("/refresh", refresh);

router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);

router.get("/me", protect, getMe);

module.exports = router;
