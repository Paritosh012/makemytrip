const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const RefreshToken = require("../models/refreshToken.model");

const { generateOtp, hashOtp, compareOtp } = require("../utils/otp.utils");
const { sendEmail, buildOtpHtml } = require("../utils/email");

const {
  signAccessToken,
  signRefreshToken,
  signSetupToken,
  verifyRefreshToken,
  verifySetupToken,
  newTokenId,
  hashToken,
  timingSafeEqual,
  REFRESH_TOKEN_TTL_MS,
} = require("../utils/token.utils");

const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  SETUP_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
  setupCookieOptions,
  clearOptions,
} = require("../config/cookies");

const PASSWORD_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_SECONDS = 30;

// ================= HELPERS =================

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

/**
 * Fire-and-forget email.
 *
 * Brevo's HTTP API can take 1–3 seconds. Awaiting it means the user stares at
 * a spinner for the length of a third-party network call we do not control.
 * We dispatch and return immediately; a failure is logged, and /resend-otp is
 * the user's recovery path.
 */
const dispatchOtpEmail = (to, otp) => {
  Promise.resolve(sendEmail(to, "Your OTP Code", buildOtpHtml(otp))).catch(
    (error) => console.error("OTP email dispatch failed:", to, error.message),
  );
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, clearOptions(accessCookieOptions()));
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions(refreshCookieOptions()));
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId,
});

/**
 * Mints an access + refresh pair, persists the refresh token's hash, and sets
 * both cookies. Returns the new tokenId so a rotation can link old -> new.
 */
const issueSession = async (req, res, user) => {
  const tokenId = newTokenId();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken({ userId: user._id, tokenId });

  await RefreshToken.create({
    userId: user._id,
    tokenId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: req.get("user-agent") || null,
    ip: req.ip || null,
  });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return tokenId;
};

const revokeAllSessions = (userId, reason) =>
  RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason },
  );

// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    if (!user) {
      user = await User.create({ name, email: normalizedEmail });
    } else {
      user.name = name;
      await user.save();
    }

    // Cooldown on register too, not just resend. Without it, re-POSTing
    // /register is an uncapped mail cannon aimed at any unverified address.
    const existingOtp = await OTP.findOne({ userId: user._id });

    if (existingOtp?.lastSentAt) {
      const secondsSinceLastSend =
        (Date.now() - existingOtp.lastSentAt.getTime()) / 1000;

      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            RESEND_COOLDOWN_SECONDS - secondsSinceLastSend,
          )} seconds before requesting another OTP`,
        });
      }
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await OTP.findOneAndUpdate(
      { userId: user._id },
      {
        otpHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    dispatchOtpEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "User successfully registered. OTP sent to your email.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= VERIFY OTP =================

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    const otpDoc = await OTP.findOne({ userId: user._id });

    if (!otpDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    if (otpDoc.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (otpDoc.attempts >= 5) {
      return res
        .status(429)
        .json({ success: false, message: "Too many attempts" });
    }

    const isMatch = await compareOtp(otp, otpDoc.otpHash);

    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpDoc._id });

    // Only the signup flow needs a password. If one already exists, this was a
    // re-verification and we hand out nothing.
    const needsPassword = !user.password;

    if (needsPassword) {
      const setupToken = signSetupToken(user._id);

      res.cookie(SETUP_COOKIE_NAME, setupToken, setupCookieOptions());

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        nextStep: "set-password",
        // Also returned in the body so a non-cookie client (mobile, Postman,
        // your Jest tests) can pass it back explicitly.
        setupToken,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      nextStep: "login",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= RESEND OTP =================

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });
    }

    const otpDoc = await OTP.findOne({ userId: user._id });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please register again.",
      });
    }

    const secondsSinceLastSend =
      (Date.now() - new Date(otpDoc.lastSentAt).getTime()) / 1000;

    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(
          RESEND_COOLDOWN_SECONDS - secondsSinceLastSend,
        )} seconds before retrying`,
      });
    }

    const otp = generateOtp();

    otpDoc.otpHash = await hashOtp(otp);
    otpDoc.expiresAt = new Date(Date.now() + OTP_TTL_MS);
    otpDoc.attempts = 0;
    otpDoc.lastSentAt = new Date();

    await otpDoc.save();

    dispatchOtpEmail(user.email, otp);

    return res
      .status(200)
      .json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= SET PASSWORD =================

/**
 * THE CRITICAL FIX.
 *
 * Old behaviour: identity came from req.body.email. Anyone who knew an email
 * could set that account's password. It also flipped isVerified to true before
 * any check, and its "password already set" guard was dead because the model
 * has select:false on password — so it overwrote existing passwords too.
 *
 * New behaviour: identity comes from the setup token minted inside verifyOtp.
 * req.body.email is ignored entirely. No valid OTP, no password.
 */
const setPassword = async (req, res) => {
  try {
    const rawToken = req.cookies?.[SETUP_COOKIE_NAME] || req.body?.setupToken;

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: "OTP verification required before setting a password",
      });
    }

    let payload;

    try {
      payload = verifySetupToken(rawToken);
    } catch {
      res.clearCookie(SETUP_COOKIE_NAME, clearOptions(setupCookieOptions()));

      return res.status(401).json({
        success: false,
        message: "Verification expired. Please verify your email again.",
      });
    }

    const { password } = req.body;

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    // select("+password") — without this the guard below is a no-op.
    const user = await User.findById(payload.userId).select("+password");

    if (!user || !user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    if (user.password) {
      return res
        .status(400)
        .json({ success: false, message: "Password already set" });
    }

    user.password = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    await user.save();

    // The setup token has done its one job — burn it.
    res.clearCookie(SETUP_COOKIE_NAME, clearOptions(setupCookieOptions()));

    // Log the user straight in; they just proved email ownership.
    await issueSession(req, res, user);

    return res.status(200).json({
      success: true,
      message: "Password set successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    // One generic message for "no such user", "not verified" and "no password
    // set" — otherwise the error text becomes an account-enumeration oracle.
    if (!user || !user.isVerified || !user.password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    await issueSession(req, res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= REFRESH =================

/**
 * Rotating refresh with reuse detection.
 *
 * Every successful refresh burns the old token and issues a new one. So if a
 * stolen token is replayed after the real user has already refreshed, we see a
 * hit on an ALREADY-REVOKED row — that can only happen if two parties hold the
 * same token. We cannot tell which one is the thief, so we kill every session
 * for that user and force a fresh login.
 */
const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
        code: "NO_REFRESH_TOKEN",
      });
    }

    let payload;

    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const stored = await RefreshToken.findOne({ tokenId: payload.tokenId });

    if (!stored) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Session not found",
        code: "SESSION_NOT_FOUND",
      });
    }

    if (stored.revokedAt) {
      await revokeAllSessions(stored.userId, "reuse_detected");
      clearAuthCookies(res);

      console.warn(
        "[auth] refresh token reuse detected for",
        String(stored.userId),
      );

      return res.status(401).json({
        success: false,
        message: "Session revoked. Please log in again.",
        code: "TOKEN_REUSE_DETECTED",
      });
    }

    if (!timingSafeEqual(stored.tokenHash, hashToken(rawToken))) {
      await revokeAllSessions(stored.userId, "hash_mismatch");
      clearAuthCookies(res);

      return res.status(401).json({
        success: false,
        message: "Session revoked. Please log in again.",
        code: "TOKEN_MISMATCH",
      });
    }

    // Claims are re-read from the DB here, not copied from the old token.
    // A role change or ban takes effect on the next refresh.
    const user = await User.findById(stored.userId);

    if (!user || !user.isVerified) {
      await revokeAllSessions(stored.userId, "user_invalid");
      clearAuthCookies(res);

      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const nextTokenId = await issueSession(req, res, user);

    stored.revokedAt = new Date();
    stored.revokedReason = "rotated";
    stored.replacedByTokenId = nextTokenId;
    await stored.save();

    return res.status(200).json({
      success: true,
      message: "Session refreshed",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= LOGOUT =================

const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (rawToken) {
      try {
        const payload = verifyRefreshToken(rawToken);

        await RefreshToken.updateOne(
          { tokenId: payload.tokenId, revokedAt: null },
          { revokedAt: new Date(), revokedReason: "logout" },
        );
      } catch {
        // Already invalid — nothing to revoke, still clear the cookies.
      }
    }

    clearAuthCookies(res);
    res.clearCookie(SETUP_COOKIE_NAME, clearOptions(setupCookieOptions()));

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// ================= LOGOUT ALL DEVICES =================

const logoutAll = async (req, res) => {
  try {
    await revokeAllSessions(req.user.userId, "logout_all");

    clearAuthCookies(res);

    return res
      .status(200)
      .json({ success: true, message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= ME =================

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  setPassword,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
};
