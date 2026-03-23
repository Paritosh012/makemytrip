const express = require("express");
const router = express.Router();

const { createBooking } = require("../controllers/booking.controller");

const auth = require("../middlewares/auth.middleware");
const tenant = require("../middlewares/tenant.middleware");
const role = require("../middlewares/role.middleware");
const subscription = require("../middlewares/subscription.middleware");

router.post(
  "/",
  auth,
  tenant,
  role("END_USER"), // or HOST if needed
  subscription,
  createBooking,
);

module.exports = router;
