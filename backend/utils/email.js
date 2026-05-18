const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password (NOT your real password)
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"MakeMyTrip Clone" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };