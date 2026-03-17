const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  submitApplication,
  getApplications,
  approveApplication,
  rejectApplication,
} = require("../controllers/host.application.controller");

// END USER
router.post("/", authMiddleware, roleMiddleware("END_USER"), submitApplication);

// SUPER ADMIN
router.get("/", authMiddleware, roleMiddleware("SUPER_ADMIN"), getApplications);
 
router.patch(
  "/:applicationId/approve",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  approveApplication,
);

router.patch(
  "/:applicationId/reject",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  rejectApplication,
);

module.exports = router;
