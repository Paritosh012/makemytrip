const Subscription = require("../models/subscription.model");

const subscriptionMiddleware = async (req, res, next) => {
  try {
    const { role, tenantId } = req.user;

    // ✅ SUPER_ADMIN bypass
    if (role === "SUPER_ADMIN") {
      return next();
    }

    // ❗ No tenant → no subscription enforcement
    if (!tenantId) {
      return next();
    }

    // ✅ Fetch subscription
    const subscription = await Subscription.findOne({
      tenantId,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "No active subscription. Please purchase a plan.",
      });
    }

    const now = new Date();

    // ❌ Expiry check (NO DB mutation here)
    if (!subscription.endDate || subscription.endDate < now) {
      return res.status(403).json({
        success: false,
        message: "Subscription expired. Please renew.",
      });
    }

    // ❌ Status check (only if you REALLY want status field)
    if (subscription.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Subscription inactive.",
      });
    }

    // ✅ Attach for downstream usage
    req.subscription = subscription;

    return next();
  } catch (err) {
    console.error("Subscription Middleware Error:", err);

    return res.status(500).json({
      success: false,
      message: "Subscription validation failed",
    });
  }
};

module.exports = subscriptionMiddleware;
