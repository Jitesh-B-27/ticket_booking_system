const db = require("../db");

const getAllMovies = async () => {
    const queryText = `
        SELECT
            id,
            title,
            description,
            duration_minutes,
            genre,
            poster_url,
            release_date
        FROM movies
        ORDER BY release_date DESC;
    `;
    const { rows } = await db.query(queryText);
    return rows;
};

const getMovieById = async (id) => {
    const queryText = `
        SELECT
            id,
            title,
            description,
            duration_minutes,
            genre,
            poster_url,
            release_date
        FROM movies
        WHERE id = $1;
    `;
    const { rows } = await db.query(queryText, [id]); // We are fetching a single item
    return rows[0];
}

module.exports = {
    getAllMovies: getAllMovies,
    getMovieById: getMovieById,
};