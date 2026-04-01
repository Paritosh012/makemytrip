const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  setPassword,
  resendOtp,
  verifyOtp,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/verifyOtp", verifyOtp);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/logout", logout);
router.post("/resend-otp", resendOtp);

module.exports = router;
