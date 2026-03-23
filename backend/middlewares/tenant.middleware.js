const Tenant = require("../models/tenant.model");

const tenantStatusMiddleware = async (req, res, next) => {
  try {
    // SUPER_ADMIN bypass
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!req.user.tenantId) {
      return next();
    }

    const tenant = await Tenant.findById(req.user.tenantId);

    if (!tenant) {
      return res.status(403).json({ message: "Tenant not found" });
    }

    if (tenant.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Tenant not activated. Please purchase a plan.",
      });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Tenant validation failed" });
  }
};

module.exports = tenantStatusMiddleware;
