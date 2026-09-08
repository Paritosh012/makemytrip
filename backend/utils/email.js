// Email via Brevo's HTTP API (api.brevo.com, port 443) — Render's free
// tier blocks outbound SMTP, so email must travel over HTTPS.
// No SDK needed: Node 18+ has global fetch. CommonJS like the rest
// of the backend.

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

const FROM_EMAIL = process.env.EMAIL_FROM || "no-reply@example.com";
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