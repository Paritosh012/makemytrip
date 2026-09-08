const crypto = require("crypto");
const bcrypt = require("bcrypt");

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = 10;

/**
 * crypto.randomInt(), not Math.random().
 *
 * Math.random() is a fast PRNG seeded from a small internal state. Observe
 * enough outputs and the sequence is predictable — for an OTP that is the
 * whole security model gone. crypto.randomInt() pulls from the OS entropy
 * pool and is rejection-sampled, so there is no modulo bias either.
 *
 * padStart keeps the length fixed: 42 becomes "000042", not "42".
 */
const generateOtp = () => {
  const upperBound = 10 ** OTP_LENGTH;

  return crypto.randomInt(0, upperBound).toString().padStart(OTP_LENGTH, "0");
};

const hashOtp = (otp) => bcrypt.hash(String(otp), OTP_SALT_ROUNDS);

const compareOtp = (otp, otpHash) => bcrypt.compare(String(otp), otpHash);

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  OTP_LENGTH,
};
