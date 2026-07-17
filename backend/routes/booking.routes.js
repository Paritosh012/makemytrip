const express = require("express");
const router = express.Router();

const {
  createBooking,
  cancelBooking,
  getBookings,
  getBookingsByHost,
} = require("../controllers/booking.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

router.post("/", auth, role("END_USER"), createBooking);
router.patch("/:bookingId/cancel", auth, role("END_USER"), cancelBooking);
router.get("/", auth, role("END_USER"), getBookings);
router.get("/host", auth, getBookingsByHost);

module.exports = router;
