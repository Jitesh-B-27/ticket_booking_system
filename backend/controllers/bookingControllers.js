const Event = require("../models/Event");
const Seat = require("../models/Seat");
const mongoose = require("mongoose");

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

module.exports = {
    getEvents: getEvents,
    getSeats: getSeats,
}