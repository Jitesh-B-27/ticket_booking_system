const db = require("../db");

const createPendingBooking = async (bookingId, userId, showtimeId, seatId) => {
    const queryText = `
        INSERT INTO bookings(id, user_id, showtime_id, seat_id, status)
        VALUES ($1, $2, $3, $4, 'PENDING')
        RETURNING id, status, created_at;
    `;
    const { rows } = await db.query(queryText, [bookingId, userId, showtimeId, seatId]);
    return rows[0];
};

const getBookingStatus = async (bookingId) => {
    const queryText = `
        SELECT
            b.id,
            b.status,
            b.created_at,
            b.booked_at,
            u.name AS user_name,
            s.seat_number,
            t.name AS theater_name,
            m.title AS movie_title,
            sh.showtime_start
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN seats s ON b.seat_id = s.id
        JOIN showtimes sh ON b.showtime_id = sh.id
        JOIN movies m ON sh.movie_id = m.id
        JOIN theaters t ON sh.theater_id = t.id
        WHERE b.id = $1;
    `;

    const { rows } = await db.query(queryText, [bookingId]);
    return rows[0];
};

module.exports = {
    createPendingBooking: createPendingBooking,
    getBookingStatus: getBookingStatus,
};