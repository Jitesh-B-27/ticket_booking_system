const { get } = require("mongoose");
const db = require("../db");

const getSeatsForShowTime = async (showTimeId) => {
    const queryText = `
        SELECT
            s.id AS seat_id,
            s.seat_number,
            s.row_number,
            b.id AS booking_id,
            b.status AS booking_status
        FROM seats s
        -- We JOIN on the 'theaters' table to link the seats to the showtime
        JOIN theaters t ON s.theater_id = t.id
        JOIN showtimes sh ON sh.theater_id = t.id
        -- We LEFT JOIN on the 'bookings' table to find if a seat is booked.
        -- LEFT JOIN ensures we get ALL seats, even if they don't have a booking yet.
        LEFT JOIN bookings b ON b.seat_id = s.id AND b.showtime_id = sh.id
        WHERE sh.id = $1
        ORDER BY s.row_number, s.col_number;
    `;
    
    const { rows } = await db.query(queryText, [showTimeId]);
    return rows;
};

module.exports = {
    getSeatsForShowTime: getSeatsForShowTime,
};