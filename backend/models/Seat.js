const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event',                      
        required: true                     
    },
    seatNumber: {
        type: String,
        required: true,                    
        trim: true
    },
    isBooked: {
        type: Boolean,
        default: false                     
    },
    bookedBy: {
        type: String,                      
        default: null                      
    },
    lockedUntil: {
        type: Date,
        default: null                      
    }
});

seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true }); 
seatSchema.index({ eventId: 1, isBooked: 1 });                     

module.exports = mongoose.model('Seat', seatSchema);