const mongoose = require("mongoose");
const amqp = require("amqplib");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
dotenv.config();

const Event = require("../models/Event");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");

const { acquireLock, releaseLock } = require("../utils/redisUtils");

const BOOKING_QUEUE = 'booking_requests';
const LOCK_TTL = 10000;

let connection = null;
let channel = null;

const startWorker = async () => {
    const mongoUri = process.env.MONGO_URI;
    const rabbitmqUri = process.env.RABBITMQ_URI;

    if (!mongoUri || !rabbitmqUri) {
        console.error('FATAL ERROR: MONGO_URI or RABBITMQ_URI not defined in .env. Worker cannot start.');
        process.exit(1);
    }

    try{
        await mongoose.connect(mongoUri);
        console.log("Worker connected to MongoDB");

        connection = await amqp.connect(rabbitmqUri);
        connection.on('close', () => {
            console.error('RabbitMQ connection closed! Worker attempting to reconnect...');
            process.exit(1);
        });
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error: ', err.message);
            process.exit(1);
        });

        channel = await connection.createChannel();

        await channel.assertQueue(BOOKING_QUEUE, {durable: true});
        console.log(`Worker asserted '${BOOKING_QUEUE}' queue.`);

        channel.prefetch(1);
        console.log(`Worker waiting for messages in '${BOOKING_QUEUE}'. To exit press CTRL+C`);

        channel.consume(BOOKING_QUEUE, async (msg) => {
            if (msg === null){
                console.log('RabbitMQ consumer cancelled');
                return;
            }

            let bookingRequest;
            let session;
            let lockAcquired = false;

            try{
                bookingRequest = JSON.parse(msg.content.toString());
                const { bookingRequestId, userId, eventId, seatId } = bookingRequest;

                console.log(`[Worker] Processing booking request ID: ${bookingRequestId} for Seat: ${seatId}`);

                const lockValue = uuidv4();
                const lockKey = `lock:seat:${seatId}`;

                lockAcquired = await acquireLock(lockKey, lockValue, LOCK_TTL);

                if (!lockAcquired){
                    console.warn(`[Worker] Could not acquire lock for seat ${seatId}. Booking request ID: ${bookingRequestId} will be marked as FAILED or retried.`);

                    await Booking.findByIdAndUpdate(bookingRequestId, { status: 'Failed', bookingTime: new Date() });
                    channel.ack(msg);
                    return;
                }

                session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const seat = await Seat.findById(seatId).session(session);

                    if (!seat){
                        throw new Error('Seat not Found.');
                    }
                    if (seat.isBooked){
                        throw new Error('Seat is already booked.');
                    }

                    if (seat.lockedUntil && seat.lockedUntil > new Date()){
                        throw new Error('Seat is temporily locked.') //This should be caught by Redis Lock
                    }

                    seat.isBooked = true;
                    seat.bookedBy = userId;
                    seat.lockedUntil = null; //Clear any temporary lock
                    await seat.save({ session });

                    const event = await Event.findById(eventId).session(session);
                    if (!event){
                        throw new Error('Event not found for seat update');
                    }
                    if (event.availableSeats <= 0){
                        throw new Error('No available seats left for event');
                    }
                    event.availableSeats = event.availableSeats - 1;
                    await event.save({ session });

                    //Update Booking Status To CONFIRMED
                    await Booking.findByIdAndUpdate(
                        bookingRequestId,
                        {status: 'CONFIRMED', bookingTime: new Date() },
                        {new: true, session } // (new: true) returns the updated document
                    );

                    console.log(`[Worker] Successfully booked seat ${seat.seatNumber} for Event ${event.name}. Booking ID: ${bookingRequestId}`);
                });

                // Release the distributed Lock for the seat
                // This must happen after the Transaction is successfully commited
                if (lockAcquired) {
                    await releaseLock(lockKey);
                }

                // Acknowledge the message to RabbitMq and tell RabbitMQ that the message has been successfully processed and can be Removed
                channel.ack(msg);
            } catch(error){
                console.error(`[Worker] Error processing booking request ID: ${bookingRequest ? bookingRequest.bookingRequestId : 'N/A'}:`, error.message);

                if (lockAcquired) {
                    await releaseLock(lockKey);
                }

                if (bookingRequest && bookingRequest.bookingRequestId){
                    try{
                        await Booking.findByIdAndUpdate(bookingRequest.bookingRequestId, {status: 'FAILED', bookingTime: new Date()});
                        console.log(`[Worker] Booking ID: ${bookingRequest.bookingRequestId} marked as FAILED.`);
                    } catch (updateErr){
                        console.error(`[Worker] Failed to update booking status to FAILED for ID: ${bookingRequest.bookingRequestId}:`, updateErr.message);
                    }
                }

                // Nack the message
                // We are not using Dead Letter here
                // We are going to simply requeue
                channel.nack(msg, false, true); // (msg, allUpTo, requeue)
            } finally{
                if (session){
                    await session.endSession();
                }
            }
        }, { noAck: false }); // noAck: false means we manually acknowledge messages using channel.ack() or channel.nack()
    } catch (err){
        console.error('Worker failed to start: ', err.message);
        process.exit(1);
    }
};

startWorker();

process.on('SIGINT', async () => {
    console.log('\nWorker recieved SIGINT. Shutting down gracefully....');
    if (channel){
        try{
            await channel.close();
            console.log('RabbitMQ channel closed.');
        } catch (e){
            console.error('Error closing RabbitMQ channel: ', e.message);
        }
    }
    if (connection){
        try{
            await connection.close();
            console.log('RabbitMQ connection closed.');
        } catch(e){
            console.error('Error closing RabbitMQ connection: ', e.message);
        }
    }

    if (mongoose.connection.readyState === 1){
        try{
            await mongoose.disconnect();
            console.log('MongoDB connection closed.');
        } catch (e){
            console.error('Error closing MongoDB connection: ', e.message);
        }
    }

    process.exit(0);
});