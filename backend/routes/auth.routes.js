const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  setPassword,
  resendOtp,
  verifyOtp,
  getMe,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/logout", logout);
router.post("/resend-otp", resendOtp);

router.get("/me", authMiddleware, getMe);

module.exports = router;
