const { verifyAccessToken } = require("../utils/token.utils");
const { ACCESS_COOKIE_NAME } = require("../config/cookies");

/**
 * Reads the ACCESS token only. A refresh token presented here fails the
 * `type` check inside verifyAccessToken, so a long-lived token can never be
 * used to hit a protected route directly.
 */
const protect = (req, res, next) => {
  const header = req.headers.authorization;

  const token =
    req.cookies?.[ACCESS_COOKIE_NAME] ||
    // Transitional: accept the old cookie name so sessions issued before this
    // deploy do not all 401 at once. DELETE THIS after a week in production.
    req.cookies?.token ||
    (header?.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      code: "NO_TOKEN",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    // Shape kept identical to the old `req.user = decoded` so every existing
    // controller keeps working untouched.
    req.user = {
      userId: payload.userId,
      id: payload.userId,
      _id: payload.userId,
      role: payload.role,
      tenantId: payload.tenantId,
      permissions: payload.permissions || [],
    };

    return next();
  } catch (error) {
    const isExpired = error.name === "TokenExpiredError";

    // The frontend interceptor keys off `code`: TOKEN_EXPIRED means "call
    // /refresh and retry", anything else means "send them to login".
    return res.status(401).json({
      success: false,
      message: isExpired ? "Access token expired" : "Unauthorized",
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
    });
  }
};

/**
 * Role gate. Usage: authorize("HOST", "ADMIN")
 * Duplicates role.middleware.js — kept only so auth.routes.js has one import.
 */
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    const roles = allowedRoles.flat();

    if (!req.user?.role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return next();
  };

/*
-------------------------------------------------------
EXPORT SHAPE — read this before changing it
-------------------------------------------------------
Six route files already do:

    const authMiddleware = require("../middlewares/auth.middleware");
    router.use(authMiddleware);

...which needs module.exports to BE the function. auth.routes.js does:

    const { protect } = require("../middlewares/auth.middleware");

...which needs a named property. Functions are objects in JS, so we export the
function and hang the named exports off it. Both import styles resolve, and no
existing route file needs editing.
-------------------------------------------------------
*/
module.exports = protect;

module.exports.protect = protect;
module.exports.authorize = authorize;

// Legacy aliases used elsewhere in the codebase.
module.exports.authMiddleware = protect;
module.exports.verifyToken = protect;
module.exports.auth = protect;
