const { getClient } = require("./db");
const path = require("path");
const { promises: fs } = require("fs");

const seedData = async () => {
    const client = await getClient();
    try{
        await client.query('BEGIN');
        console.log('Seeding initial data...');

        // Seed User Data
        const users = [['John Doe', 'john.doe@example.com'], ['Jane Smith', 'jane.smith@example.com'],];
        console.log("Seeding Users");

        for (const [name, email] of users){
            await client.query('INSERT INTO users(name, email) VALUES($1, $2) ON CONFLICT (email) DO NOTHING', [name, email]);
        }

        const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['john.doe@example.com']);
        const johnDoeId = userResult.rows[0].id;

        // Seed Movie Data
        const movieResult = await client.query(
            `INSERT INTO movies(title, description, duration_minutes, genre, poster_url, release_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (title) DO NOTHING
            RETURNING id`,
            [
                'The Last Sentinel',
                'In a dystopian future, a lone sentinel fights to protect the last remaining human settlement from an AI rebellion.',
                145,
                'Sci-Fi',
                'https://example.com/the-last-sentinel-poster.jpg',
                '2025-08-15'
            ]
        );
        const movieId = movieResult.rows[0]?.id;
        if (!movieId){
            throw new Error('Movie not inserted or already exists. Seeder cannot proceed');
        }

        // Seed Theater Data
        const theaterResult = await client.query(
            `INSERT INTO theaters(name, total_seats) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id`, ['Main Hall', 100]
        );
        const theaterId = theaterResult.rows[0]?.id;
        if (!theaterId){
            throw new Error('Theater not inserted or already exists. Seeder cannot proceed.');
        }

        // Seed Seats For The Theater
        console.log('Seeding Seats.....');
        const seatQueries = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const seatsPerRow = 10;
        for (let i = 0; i < rows.length; i++){
            for (let j = 1; j < seatsPerRow; j++){
                const seatNumber = `${rows[i]}${j}`;
                seatQueries.push(
                    client.query(
                        `INSERT INTO seats(theater_id, seat_number, row_number, col_number)
                        VALUES ($1, $2, $3, $4) ON CONFLICT (theater_id, seat_number) DO NOTHING`, 
                        [theaterId, seatNumber, rows[i], j]
                    )
                );
            }
        }

        await Promise.all(seatQueries);

        // Seed ShowTimes
        const showtimeResult = await client.query(
            `INSERT INTO showtimes(movie_id, theater_id, showtime_start)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING id`,
            [movieId, theaterId, '2025-08-16 19:00:00+05:30']
        );

        const showtimeId = showtimeResult.rows[0]?.id;
        if (!showtimeId){
            throw new Error('Showtime not inserted or already exists. Seeder cannot proceed.');
        }

        // Dummy Booking Data
        const seatToBook = await client.query('SELECT id FROM seats WHERE theater_id = $1 AND seat_number = $2', [theaterId, 'B5']);
        const seatId = seatToBook.rows[0]?.id;
        if (seatId) {
            await client.query(
                `INSERT INTO bookings(user_id, showtime_id, seat_id, status, booked_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (showtime_id, seat_id) DO NOTHING`,
                [johnDoeId, showtimeId, seatId, 'CONFIRMED', '2025-08-15 10:00:00+05:30']
            );
        }

        await client.query('COMMIT');
        console.log('Seeding completed successfully!');
    } catch (error){
        await client.query('ROLLBACK');
        console.error('Seeding failed: ', error);
        throw error;
    } finally {
        client.release();
    }
};

seedData().catch(err => {
    console.error('Fatal error during seeding: ', err);
    process.exit(1);
});