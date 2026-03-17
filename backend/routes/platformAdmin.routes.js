const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  getTenants,
  suspendTenant,
  activateTenant,
  getOneTenant,
  updateTenantPlan,
} = require("../controllers/platformAdmin.controller");

router.get("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), getTenants);

router.get(
  "/:tenantId",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getOneTenant,
);

router.patch(
  "/:tenantId/suspend",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  suspendTenant,
);

router.patch(
  "/:tenantId/activate",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  activateTenant,
);

router.patch(
  "/:tenantId/plan",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateTenantPlan,
);

module.exports = router;
