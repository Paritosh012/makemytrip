// const nodemailer = require("nodemailer");
// const dns = require("dns");

// // Force Node.js to prefer IPv4 over IPv6
// dns.setDefaultResultOrder("ipv4first");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // true only for port 465
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Gmail App Password
//   },
// });

// // Verify SMTP connection when server starts
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ SMTP Connection Error:", error);
//   } else {
//     console.log("✅ SMTP Server Ready");
//   }
// });

// const sendEmail = async (to, subject, html) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"MakeMyTrip Clone" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });

//     console.log("✅ Email sent:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("❌ Email Send Error:", error);
//     throw error;
//   }
// };

// module.exports = { sendEmail };

// utils/email.js
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// // onboarding@resend.dev works immediately with zero DNS setup — good enough
// // for the demo. Swap to your own verified domain later.
// const FROM = process.env.EMAIL_FROM || "Travel SaaS <onboarding@resend.dev>";

// export async function sendEmail(to, subject, html) {
//   const { data, error } = await resend.emails.send({
//     from: FROM,
//     to,
//     subject,
//     html,
//   });
//   if (error) {
//     console.error("❌ Email send failed:", error);
//     throw new Error(error.message);
//   }
//   return data;
// }

// export function buildOtpHtml(otp) {
//   return `
//     <div style="font-family:sans-serif;max-width:480px;margin:auto">
//       <h2>Verify your email</h2>
//       <p>Your OTP code is:</p>
//       <h1 style="letter-spacing:6px;color:#2563eb">${otp}</h1>
//       <p style="color:#666">This code expires in 5 minutes.</p>
//     </div>`;
// }


// utils/email.js
// Email via Brevo's HTTP API (api.brevo.com, port 443) — Render's free
// tier blocks outbound SMTP, so email must travel over HTTPS.
// No SDK needed: Node 18+ has global fetch. CommonJS like the rest
// of the backend.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

const FROM_EMAIL = process.env.EMAIL_USER || "jaiswalparitosh8@gmail.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Travel SaaS";

async function sendEmail(to, subject, html) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set");
  }

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("❌ Email send failed:", res.status, err);
    throw new Error(err.message || `Email failed with status ${res.status}`);
  }

  return res.json();
}

function buildOtpHtml(otp) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Verify your email</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing:6px;color:#2563eb">${otp}</h1>
      <p style="color:#666">This code expires in 5 minutes.</p>
    </div>`;
}

module.exports = { sendEmail, buildOtpHtml };