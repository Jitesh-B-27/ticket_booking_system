const Event = require("../models/Event");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");

const { publishToQueue } = require("../queue/rabbitmqPublisher");

const getEvents = async (req, res) => {
    try{
        const events = await Event.find().select('_id name totalSeats availableSeats date');
        res.json(events);
    } catch(error){
        console.error('Error in getEvents:', error);
        res.status(500).json({ message: 'Server error fetching events.' });
    }
}

const getSeats = async (req, res) => {
    try{
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)){
            return res.status(400).json({ message: 'Invalid Event ID format.' });
        }

        const event = await Event.findById(eventId).select('name totalSeats availableSeats');
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        const seats = await Seat.find({eventId}).select('seatNumber isBooked lockedUntil');
        res.json({event, seats});
    } catch(error){
        console.error('Error in getSeats:', error);
        res.status(500).json({ message: 'Server error fetching seats.' });
    }
}

const createBooking = async (req, res) => {
    const { userId, eventId, seatId } = req.body;

    if (!userId || !eventId || !seatId){
        res.status(400).json({message: 'Missing required booking information (userId, eventId, seatId).'});
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(seatId)){
        res.status(400).json({message: 'Invalid ID format for userId, eventId, or seatId.'});
    }

    const bookingRequestId = new mongoose.Types.ObjectId();

    try{
        const newBooking = new Booking({
            _id: bookingRequestId,
            userId,
            eventId,
            seatId,
            status: 'PENDING',
            requestTime: new Date()
        });
        await newBooking.save();

        const bookingMessage = {
            bookingRequestId: newBooking._id.toString(),
            userId: newBooking.userId.toString(),
            eventId: newBooking.eventId.toString(),
            seatId: newBooking.seatId.toString()
        };

        const published = await publishToQueue(bookingMessage);

        if (!published){
            console.log(`[API] Failed to publish booking request ID ${bookingRequestId} to RabbitMQ. RabbitMQ connection likely down.`);
            await Booking.findByIdAndUpdate(newBooking._id, { status: 'FAILED', error: 'Failed to publish to message queue. Please contact support.'});
            return res.status(500).json({
                message: 'Booking request failed to be queued. Please try again or contact support.',
                bookingId: newBooking._id,
                status: 'FAILED'
            });
        }

        res.status(202).json({
            message: 'Booking request received and is being processed.',
            bookingId: newBooking._id,
            status: 'PENDING'
        });
    } catch(error){
        console.error('Error in createBooking: ', error);
        res.status(500).json({message: 'Server error initiating booking request.'});
    }
}

const getBookingStatus = async (req, res) => {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)){
        return res.status(400).json({ message: 'Invalid booking ID format.'});
    }

    try{
        const booking = await Booking.findById(bookingId)
        .populate('eventId', 'name date location availableSeats')
        .populate('seatId', 'seatNumber section row isBooked');

        if (!booking){
            return res.status(404).json({message: 'Booking not found'});
        }

        res.status(200).json({
            message: 'Booking status retrieved successfully.',
            booking: {
                id: booking._id,
                userId: booking.userId,
                event: booking.eventId, // This will be the populated event object
                seat: booking.seatId,   // This will be the populated seat object
                status: booking.status,
                requestTime: booking.requestTime,
                bookingTime: booking.bookingTime, // Will be set by worker once CONFIRMED/FAILED
                error: booking.error // Will contain error message if FAILED
            }
        });
    } catch(error){
        console.error('Error in getBookingStatus: ', error);
        res.status(500).json({message: 'Server error retrieving booking status.'});
    }
}

module.exports = {
    getEvents: getEvents,
    getSeats: getSeats,
    createBooking: createBooking,
    getBookingStatus: getBookingStatus,
}