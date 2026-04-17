const permissionMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      // SUPER_ADMIN bypass
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      // 🚨 SAFE GUARD
      const userPermissions = Array.isArray(req.user.permissions)
        ? req.user.permissions
        : [];

      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      next();
    } catch (err) {
      console.error("Permission middleware error:", err);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

module.exports = permissionMiddleware;