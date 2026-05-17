const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const createTransporter = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
};

const sendEmail = async (to, subject, html) => {
  const transporter = await createTransporter();
  await transporter.sendMail({
    from: `"TravelSaaS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };
