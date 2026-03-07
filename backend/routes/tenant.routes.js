const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  createTenant,
  getTenants,
  suspendTenant,
  activateTenant,
  getOneTenant,
  updateTenantPlan,
} = require("../controllers/tenant.controller");

// SUPER_ADMIN –

// create tenant
router.post("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), createTenant);

// get all tenants
router.get("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), getTenants);

//suspend tenant
router.patch(
  "/:tenantId/suspend",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  suspendTenant,
);

//activate tenant
router.patch(
  "/:tenantId/activate",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  activateTenant,
);

//get one tenant

router.get(
  "/:tenantId",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getOneTenant,
);

router.patch(
  "/:tenantId/plan",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateTenantPlan,
);

module.exports = router;
