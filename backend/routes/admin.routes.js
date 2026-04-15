const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const permissionMiddleware = require("../middlewares/permission.middleware");

const {
  getAllUsers,
  promoteToAdmin,
  updateUserPermissions,
  suspendUser,

  getTenants,
  getOneTenant,
  suspendTenant,
  activateTenant,
  updateTenantPlan,
} = require("../controllers/platformAdmin.controller");

// apply auth globally
router.use(authMiddleware);

// ================= USERS =================

// Get all users
router.get("/users", permissionMiddleware("VIEW_USERS"), getAllUsers);

// Promote user to ADMIN
router.patch(
  "/users/:userId/promote",
  permissionMiddleware("MANAGE_USERS"),
  promoteToAdmin,
);

// Update permissions
router.patch(
  "/users/:userId/permissions",
  permissionMiddleware("MANAGE_USERS"),
  updateUserPermissions,
);

// Suspend user
router.patch(
  "/users/:userId/suspend",
  permissionMiddleware("MANAGE_USERS"),
  suspendUser,
);

// ================= TENANTS =================

// Get all tenants
router.get("/tenants", permissionMiddleware("VIEW_TENANTS"), getTenants);

// Get one tenant
router.get(
  "/tenants/:tenantId",
  permissionMiddleware("VIEW_TENANTS"),
  getOneTenant,
);

// Suspend tenant
router.patch(
  "/tenants/:tenantId/suspend",
  permissionMiddleware("MANAGE_TENANTS"),
  suspendTenant,
);

// Activate tenant
router.patch(
  "/tenants/:tenantId/activate",
  permissionMiddleware("MANAGE_TENANTS"),
  activateTenant,
);

// Update plan
router.patch(
  "/tenants/:tenantId/plan",
  permissionMiddleware("MANAGE_TENANTS"),
  updateTenantPlan,
);

module.exports = router;
