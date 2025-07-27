const mongoose = require('mongoose'); 
const Event = require('../models/Event'); 
const Seat = require('../models/Seat');   
const dotenv = require('dotenv');  

dotenv.config();

const seedDatabase = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri){
        console.error('FATAL ERROR: MONGO_URI not found in .env. Please ensure it is set.');
        process.exit(1);
    }

    try{
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully for seeding.');

        await Event.deleteMany({}); //To remove existing data
        await Seat.deleteMany({});  //To remove existing data
        console.log('Existing events and seats cleared from the database.');

        const totalSeatsForEvent = 5000;
        const event = new Event({
            name: 'Global Tech Conference 2025',
            totalSeats: totalSeatsForEvent,
            availableSeats: totalSeatsForEvent,
            date: new Date('2025-08-15T09:00:00Z')
        });

        await event.save();
        console.log(`Created Event: "${event.name}" with ${event.totalSeats} seats.`);

        const seats = [];
        for (let i = 1; i <= totalSeatsForEvent; i++){
            seats.push({
                eventId: event._id,
                seatNumber: `SEC-A-${String(i).padStart(4, '0')}`,
                isBooked: false,
                lockedUntil: null
            })
        }

        await Seat.insertMany(seats) //Store all the seats in the collection in one go instead of one by one
        console.log(`Created ${totalSeatsForEvent} seats for "${event.name}".`);

        console.log('Database seeding complete!');
    } catch(err){
        console.error('Error during database seeding:', error);
    } finally{
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

seedDatabase();