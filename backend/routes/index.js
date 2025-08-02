const express = require("express");
const router = express.Router();

const moviesController = require("../controllers/moviesController");
const showtimesController = require("../controllers/showtimeController");
const bookingController = require("../controllers/bookingControllerPG");

router.get('/movies', moviesController.getAllMovies);
router.get('/movies/:id', moviesController.getMovieById);

router.get('/movies/:movieId/showtimes', showtimesController.getShowtimesForMovie);
router.get('/showtimes/:showtimeId/seats', showtimesController.getSeatsForShowTime);

router.post('/bookings', bookingController.createBooking);
router.get('/bookings/:bookingId', bookingController.getBookingStatus);

module.exports = router;