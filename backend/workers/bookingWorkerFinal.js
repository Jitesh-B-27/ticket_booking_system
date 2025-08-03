const amqp = require("amqplib");
const { getClient } = require("../db");
const { redisClient, acquireLock, releaseLock } = require("../utils/redisUtils");
require('dotenv').config();

const QUEUE_NAME = 'booking_requests';
const LOCK_TTL = 30000; // 30 seconds

const processMessage = async (msg, channel) => {
    const bookingMessage = JSON.parse(msg.content.toString());
    const { bookingRequestId, showtimeId, seatId } = bookingMessage;
    const lockKey = `lock:seat:${showtimeId}:${seatId}`;

    let lockValue = false;
    let transactionClient;

    try{
        console.log(`[Worker] Received booking request for seat ${seatId} at showtime ${showtimeId}.`);

        lockValue = await acquireLock(lockKey, LOCK_TTL);

        if (!lockValue){
            console.log(`[Worker] Could not aquire lock for seat ${seatId}. Requeuing message.`);
            channel.nack(msg, false, true); // nack() with requeue=true
            return;
        }

        console.log(`[Worker] Lock acquired for seat ${seatId}. Starting database transaction.`);

        const db = require('../db');
        transactionClient = await db.getClient();
        await transactionClient.query('BEGIN');

        // Check Seat Availablity (Double Check) ---
        // Prevents a race condition at the last moment
        const availabilityCheck = await transactionClient.query(
            `SELECT id FROM bookings WHERE showtime_id = $1 AND seat_id = $2 AND status =$3`,
            [showtimeId, seatId, 'CONFIRMED']
        );

        if (availabilityCheck.rows.length > 0){
            // Seat is already booked. Update the PENDING booking to FAILED
            await transactionClient.query(
                'UPDATE bookings SET status = $1 WHERE id = $2',
                ['FAILED', bookingRequestId]
            );
            console.log(`[Worker] Seat ${seatId} already booked. Booking ID ${bookingRequestId} FAILED.`);
        } else{
            await transactionClient.query(
                'UPDATE bookings SET status = $1, booked_at = NOW() WHERE id = $2',
                ['CONFIRMED', bookingRequestId]
            );
            console.log(`[Worker] Booking ID ${bookingRequestId} CONFIRMED for seat ${seatId}`);
        }

        // Commit the Transaction
        await transactionClient.query('COMMIT');
        channel.ack(msg);
    } catch (error){
        console.error(`[Worker] Error processing booking request ID ${bookingRequestId}:`, error);
        if (transactionClient){
            await transactionClient.query('ROLLBACK');
            console.log(`[Worker] Transaction rolled back for booking ID ${bookingRequestId}.`);
        }
        channel.nack(msg, false, false) // Nack () without requesting, to prevent an endless loop
    } finally{
        if (lockValue){
            await releaseLock(lockKey, lockValue);
            console.log(`[Worker] Lock released for seat ${seatId}`);
        }
        if (transactionClient){
            transactionClient.release();
        }
    }
};

const startWorker = async () => {
    try{
        await redisClient.connect();
        console.log('Redis client connected in worker');

        const conn = await amqp.connect(process.env.RABBITMQ_URI);
        const channel = await conn.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`[Worker] Waiting for messages in ${QUEUE_NAME}. To exit, press CTRL+C`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null){
                await processMessage(msg, channel);
            }
        }, { noAck: false }); // Disable auto-acknowledgment
    } catch (error){
        console.error("Worker failed to Start: ", error);
        process.exit(1);
    }
};

startWorker();