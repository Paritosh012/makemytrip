const Razorpay = require("razorpay");

let instance = null;

// 🔍 TEMPORARY DIAGNOSTIC — remove once the key issue is confirmed fixed.
// Never logs the full secret. Just enough to spot whitespace, quotes,
// wrong length, or a test/live prefix mismatch.
const logKeyDiagnostics = () => {
  const id = process.env.RAZORPAY_KEY_ID || "";
  const secret = process.env.RAZORPAY_KEY_SECRET || "";

  console.log("🔍 RAZORPAY_KEY_ID diagnostics:");
  console.log("   raw length:", id.length);
  console.log("   first 10 chars:", JSON.stringify(id.slice(0, 10)));
  console.log("   last 4 chars:", JSON.stringify(id.slice(-4)));
  console.log("   starts with rzp_test_:", id.startsWith("rzp_test_"));
  console.log("   starts with rzp_live_:", id.startsWith("rzp_live_"));
  console.log("   has surrounding quotes:", id.startsWith('"') || id.endsWith('"'));
  console.log("   has whitespace:", id !== id.trim());

  console.log("🔍 RAZORPAY_KEY_SECRET diagnostics:");
  console.log("   raw length:", secret.length);
  console.log("   has surrounding quotes:", secret.startsWith('"') || secret.endsWith('"'));
  console.log("   has whitespace:", secret !== secret.trim());
};

const getRazorpay = () => {
  if (!instance) {
    logKeyDiagnostics();

    // ✅ Ensure headers are properly set
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // ✅ Add default headers to all requests
    instance.request =
      instance.request ||
      function (params) {
        if (!params.headers) {
          params.headers = {};
        }
        params.headers["Content-Type"] = "application/json";
        return Razorpay.prototype.request.call(this, params);
      };
  }

  // ✅ Debug logging
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay keys not configured!");
  }

  return instance;
};

module.exports = getRazorpay;