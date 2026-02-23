const express = require("express");
const router = express.Router();

const { createTenant } = require("../controllers/tenant.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN"]),
  createTenant
);

module.exports = router;