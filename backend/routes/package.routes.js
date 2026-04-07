const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const tenantMiddleware = require("../middlewares/tenant.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  createPackage,
  getPackages,
  getPackage,
  updatePackage,
  deletePackage,
  getPublicPackages,
} = require("../controllers/package.controller");

router.get("/public", getPublicPackages);

router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  createPackage,
);

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  getPackages,
);

router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  getPackage,
);

router.patch(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  updatePackage,
);

router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware("HOST"),
  deletePackage,
);

module.exports = router;
