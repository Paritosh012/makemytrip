const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const tenantMiddleware = require("../middlewares/tenant.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");

// SUPER_ADMIN – list tenants
router.get("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), getAllTenants);

// HOST – view own tenant
router.get(
  "/my-tenant",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  getMyTenant,
);

// SUPER_ADMIN – change tenant status
router.patch(
  "/:tenantId/status",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateTenantStatus,
);

module.exports = router;
