const express = require("express");
const router = express.Router();

const {
  createSubscription,
  verifySubscriptionPayment,
  getMySubscription,
  getSubscriptionHistory,
  cancelSubscription,
} = require("../controllers/subscription.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/create", auth, role("HOST"), createSubscription);
router.post("/verify", auth, role("HOST"), verifySubscriptionPayment);
router.get("/me", auth, role("HOST"), getMySubscription);
router.get("/history", auth, role("HOST"), getSubscriptionHistory);
router.get("/cencel", auth, role("HOST"), cancelSubscription);

module.exports = router;
