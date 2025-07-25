// backend/models/Booking.js
const mongoose = require('mongoose');

// Define the schema for a Booking
const bookingSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true // We'll use a UUID generated on the API side as the _id
    },
    userId: {
        type: String,  // The ID of the user making the booking
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    seatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'], // Allowed statuses
        default: 'PENDING',                                   // Initial status
        required: true
    },
    bookingTime: {
        type: Date,
        default: Date.now // Automatically set to the current time when created
    }
});

// Indexes for efficient querying
// Why: You'll often search for bookings by user, event, or the bookingRequestId itself.
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ _id: 1 }, { unique: true }); // Ensures the bookingRequestId is unique

module.exports = mongoose.model('Booking', bookingSchema);