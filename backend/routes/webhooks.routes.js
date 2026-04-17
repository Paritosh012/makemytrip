const express = require("express");
const router = express.Router();

const { handleWebhook } = require("../controllers/webhook.controller");

// ❗ NO auth middleware here
router.post("/razorpay", handleWebhook);

module.exports = router;