const Otp = require("../models/otp.model");
const User = require("../models/user.model");

const { compareOtp } = require("../utils/otp.utils");

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const otpDoc = await Otp.findOne({ userId: user._id });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (otpDoc.attempts >= 5) {
      return res
        .status(400)
        .json({ success: false, message: "Too many attempts" });
    }

    const isMatch = await compareOtp(otp, otpDoc.otpHash);

    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // success
    user.isVerified = true;
    await user.save();

    await Otp.deleteOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { verifyOtp };
