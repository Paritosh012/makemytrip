const express = require("express");
const router = express.Router();

const {
  purchaseSubscription,getMySubscription
} = require("../controllers/subscription.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/purchase", auth, role("HOST"), purchaseSubscription);
router.get("/me", auth, role("HOST"), getMySubscription);

module.exports = router;
