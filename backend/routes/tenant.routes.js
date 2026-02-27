const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const { createTenant } = require("../controllers/tenant.controller");

// SUPER_ADMIN – create tenant
router.post("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), createTenant);

module.exports = router;
