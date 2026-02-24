const express = require("express");
const router = express.Router();

const { createTenant } = require("../controllers/tenant.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/create",
  authMiddleware,
  createTenant,
);

module.exports = router;
