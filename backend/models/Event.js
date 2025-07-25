const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },

    availableSeats: {
        type: Number,
        required: true,
        default: 0,     
        min: 0          
    },

    date: {
        type: Date,
        required: true  
    },

}, {
    timestamps: true
})

module.exports = mongoose.model("Event", eventSchema);