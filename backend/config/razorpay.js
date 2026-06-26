const Razorpay = require("razorpay");

let instance = null;

const getRazorpay = () => {
  if (!instance) {
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
