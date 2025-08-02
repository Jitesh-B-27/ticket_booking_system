-- init.sql

-- Create 'users' table
-- A user can be linked to many bookings.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create 'movies' table
-- A movie can have many showtimes.
CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    genre VARCHAR(255),
    poster_url VARCHAR(255),
    release_date DATE
);

-- Create 'theaters' table
-- A theater can have many seats and many showtimes.
CREATE TABLE IF NOT EXISTS theaters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_seats INTEGER NOT NULL
);

-- Create 'seats' table
-- A seat belongs to a single theater.
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    theater_id INTEGER NOT NULL REFERENCES theaters(id),
    seat_number VARCHAR(10) NOT NULL,
    row_number VARCHAR(10) NOT NULL,
    col_number INTEGER NOT NULL,
    UNIQUE (theater_id, seat_number)
);

-- Create 'showtimes' table
-- A showtime links a movie to a theater at a specific time.
CREATE TABLE IF NOT EXISTS showtimes (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    theater_id INTEGER NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    showtime_start TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'ON_SALE' NOT NULL
);

-- Create 'bookings' table
-- The core booking record. A booking links a user to a seat at a showtime.
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    showtime_id INTEGER NOT NULL REFERENCES showtimes(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    status booking_status DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    booked_at TIMESTAMP WITH TIME ZONE,
    -- This unique constraint is CRITICAL for preventing double-booking
    -- at the database level.
    UNIQUE (showtime_id, seat_id)
);

-- Indexes for faster lookups on foreign keys
CREATE INDEX IF NOT EXISTS idx_seats_theater_id ON seats(theater_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_theater_id ON showtimes(theater_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime_id ON bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seat_id ON bookings(seat_id);