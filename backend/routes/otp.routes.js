const express = require("express");
const router = express.Router();

const { verifyOtp } = require("../controllers/otp.controller.js");

router.post("/verify", verifyOtp);

module.exports = router;