const db = require("../db");

const getShowtimesForMovie = async (movieId) => {
    const queryText = `
        SELECT
            sh.id,
            sh.showtime_start,
            sh.status,
            t.name AS theater_name,
            t.total_seats AS theater_total_seats,
            COUNT(b.id) AS booked_seats_count
        FROM showtimes sh
        INNER JOIN theaters t ON sh.theater_id = t.id
        -- We LEFT JOIN with the 'bookings' table to get a count of booked seats.
        LEFT JOIN bookings b ON b.showtime_id = sh.id AND b.status = 'CONFIRMED'
        WHERE sh.movie_id = $1
        GROUP BY sh.id, t.id
        ORDER BY sh.showtime_start;
    `;

    const { rows } = await db.query(queryText, [movieId]);
    return rows;
};

module.exports = {
    getShowtimesForMovie: getShowtimesForMovie,
};