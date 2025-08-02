const express = require("express");
const router = express.Router();

const { getEvents, getSeats, createBooking, getBookingStatus } = require("../controllers/bookingControllers");

router.get('/events', getEvents);
router.get('/events/:eventId/seats', getSeats);
router.post('/bookings', createBooking);
router.get('/bookings/:bookingId', getBookingStatus);

module.exports = router;