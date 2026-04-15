const checkPermission = (permissions = []) => {
  return (req, res, next) => {
    const user = req.user;

    if (user.role === "SUPER_ADMIN") return next();

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const hasPermission = permissions.some((p) => user.permissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
};

module.exports = checkPermission;
