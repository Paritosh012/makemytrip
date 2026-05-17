const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const OTP = require("../models/otp.model");

const { generateOtp, hashOtp, compareOtp } = require("../utils/otp.utils");

const { sendEmail } = require("../utils/email");

// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "All fields required" });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
      });
    } else {
      if (name) user.name = name;
      await user.save();
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { userId: user._id },
      {
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true },
    );

    await sendEmail(
      user.email,
      "Your OTP Code",
      `<h1>Verify Your Email</h1>
       <p>Your OTP code is:</p>
       <h2 style="color:blue;">${otp}</h2>
       <p>This OTP expires in 5 minutes.</p>`,
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

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

    const otpDoc = await OTP.findOne({ userId: user._id });

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

    await OTP.deleteOne({ userId: user._id });

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

// ================= RESEND OTP =================
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    const otpDoc = await OTP.findOne({ userId: user._id });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please register again.",
      });
    }

    // 🔥 Cooldown check (30 sec)
    const now = new Date();
    const diffInSeconds = (now - otpDoc.lastSentAt) / 1000;

    if (diffInSeconds < 30) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(
          30 - diffInSeconds,
        )} seconds before retrying`,
      });
    }

    // 🔥 Generate new OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 🔥 Update OTP doc
    otpDoc.otpHash = otpHash;
    otpDoc.expiresAt = expiresAt;
    otpDoc.attempts = 0;
    otpDoc.lastSentAt = now;

    await otpDoc.save();

    const { sendEmail } = require("../utils/email");

    await sendEmail(
      user.email,
      "Your OTP Code",
      `<h1>Verify Your Email</h1>
        <p>Your OTP code is:</p>
        <h2 style="color:blue;">${otp}</h2>
        <p>This OTP expires in 5 minutes.</p>`,
    );

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= SET PASSWORD =================
const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isVerified) {
      return res.status(400).json({
        message: "User not verified",
      });
    }

    // prevent overwriting password
    if (user.password) {
      return res.status(400).json({
        message: "Password already set",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user || !user.isVerified) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Password not set",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tenantId: user.tenantId,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= LOGOUT =================
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// ================= ME =================
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  setPassword,
  resendOtp,
  login,
  logout,
  verifyOtp,
  getMe,
};
