const Subscription = require("../models/subscription.model");

const subscriptionMiddleware = async (req, res, next) => {
  try {
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!req.user.tenantId) {
      return next();
    }

    const subscription = await Subscription.findOne({
      tenantId: req.user.tenantId,
    });

    if (!subscription) {
      return res.status(403).json({
        message: "Please purchase a plan",
      });
    }

    const now = new Date();

    if (subscription.endDate < now) {
      subscription.status = "EXPIRED";
      await subscription.save();

      return res.status(403).json({
        message: "Subscription expired. Please renew.",
      });
    }

    if (subscription.endDate < now) {
      subscription.status = "EXPIRED";
      await subscription.save();

      return res.status(403).json({ message: "Subscription expired" });
    }

    if (subscription.status !== "ACTIVE") {
      return res.status(403).json({ message: "Subscription inactive" });
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Subscription validation failed" });
  }
};

module.exports = subscriptionMiddleware;
