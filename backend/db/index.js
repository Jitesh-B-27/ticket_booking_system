const { Pool } = require("pg");

const pool = new Pool({
  user: 'postgres', // Default PostgreSQL user
  host: 'localhost', // Host where the PostgreSQL container is running
  database: 'movie_ticket_booking', // Default database name
  password: 'ican&Iwill2', // Password set in POSTGRES_PASSWORD
  port: 5432, // Port exposed by the PostgreSQL container
});

pool.on('connect', () => {
    console.log("✅ Successfully connected to PostgreSQL!");
});

pool.on('error', (err, client) => {
    console.error("❌ Unexpected error on idle client: ", err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};