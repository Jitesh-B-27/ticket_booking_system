const express = require("express");
const router = express.Router();

const { getEvents, getSeats } = require("../controllers/bookingControllers");

router.get('/events', getEvents);
router.get('/events/:eventId/seats', getSeats);

module.exports = router;