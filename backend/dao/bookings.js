// backend/dao/bookings.js

const { query } = require('../db');

exports.createPendingBooking = async (bookingId, userId, showtimeId, seatId) => {
    const result = await query(
        'INSERT INTO bookings (id, user_id, showtime_id, seat_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [bookingId, userId, showtimeId, seatId, 'PENDING']
    );
    return result.rows[0];
};

exports.getBookingStatus = async (bookingId) => {
    const result = await query(
        `SELECT
            b.id,
            b.status,
            b.created_at,
            b.booked_at,
            u.id AS user_id,
            sh.id AS showtime_id,
            sh.showtime_start,
            m.id AS movie_id,
            m.title AS movie_title,
            t.id AS theater_id,
            t.name AS theater_name,
            s.id AS seat_id,
            s.seat_number,
            s.row_number
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN showtimes sh ON b.showtime_id = sh.id
        JOIN movies m ON sh.movie_id = m.id
        JOIN theaters t ON sh.theater_id = t.id
        JOIN seats s ON b.seat_id = s.id
        WHERE b.id = $1`,
        [bookingId]
    );
    return result.rows[0];
};