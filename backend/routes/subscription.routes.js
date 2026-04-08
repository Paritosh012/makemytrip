const express = require("express");
const router = express.Router();

const {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,
} = require("../controllers/subscription.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/create-order", auth, role("HOST"), createSubscriptionOrder);
router.post("/verify", auth, role("HOST"), verifySubscriptionPayment);
router.get("/me", auth, role("HOST"), getMySubscription);

module.exports = router;
