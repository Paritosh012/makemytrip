  const express = require("express");
  const router = express.Router();

  const {
    purchaseSubscription,
  } = require("../controllers/subscription.controller");

  const auth = require("../middlewares/auth.middleware");
  const role = require("../middlewares/role.middleware");

  router.post("/purchase", auth, role("HOST"), purchaseSubscription);

  module.exports = router;
  