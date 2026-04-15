const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const permissionMiddleware = require("../middlewares/permission.middleware");

const {
  submitApplication,
  getApplications,
  approveApplication,
  rejectApplication,
} = require("../controllers/host.application.controller");

/*
-------------------------------------------------------
END USER → Submit application
-------------------------------------------------------
*/
router.post("/", authMiddleware, roleMiddleware("END_USER"), submitApplication);

/*
-------------------------------------------------------
ADMIN / SUPER_ADMIN → View applications
-------------------------------------------------------
*/
router.get(
  "/",
  authMiddleware,
  permissionMiddleware("APPROVE_HOSTS"),
  getApplications,
);

/*
-------------------------------------------------------
ADMIN / SUPER_ADMIN → Approve
-------------------------------------------------------
*/
router.patch(
  "/:applicationId/approve",
  authMiddleware,
  permissionMiddleware("APPROVE_HOSTS"),
  approveApplication,
);

/*
-------------------------------------------------------
ADMIN / SUPER_ADMIN → Reject
-------------------------------------------------------
*/
router.patch(
  "/:applicationId/reject",
  authMiddleware,
  permissionMiddleware("APPROVE_HOSTS"),
  rejectApplication,
);

module.exports = router;
