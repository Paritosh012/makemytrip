const express = require("express");
const router = express.Router();

const {
  createBooking,
  cancelBooking,
} = require("../controllers/booking.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/", auth, role("END_USER"), createBooking);
router.patch("/:bookingId/cancel", auth, role("END_USER"), cancelBooking);

module.exports = router;
