const bcrypt = require("bcrypt");

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP
const hashOtp = async (otp) => {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
};

// Compare OTP
const compareOtp = async (otp, otpHash) => {
  return await bcrypt.compare(otp, otpHash);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
};
