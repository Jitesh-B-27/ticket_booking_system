const amqp = require("amqplib");
const dotenv = require("dotenv");

dotenv.config();

let connection = null;
let channel = null;

const BOOKING_QUEUE = "booking_requests";

const connectPublisherRabbitMq = async () => {
    try{
        const rabbitmqUri = process.env.RABBITMQ_URI;

        if (!rabbitmqUri) {
            console.error('FATAL ERROR: RABBITMQ_URI not defined in .env. Cannot connect to RabbitMQ.');
            process.exit(1); // Exit if essential config is missing
        }

        if (!connection){
            connection = await amqp.connect(rabbitmqUri);
            connection.on('close', () => {
                console.error('RabbitMQ connection closed! Attempting to reconnect...');
                connection = null;
                channel = null;
            });

            connection.on('error', () => {
                console.error('RabbitMQ connection error:', err.message);
            });
            console.log('Publisher connected to RabbitMQ.');
        }

        if (!channel){
            channel = await connection.createChanel();
            await channel.assertQueue(BOOKING_QUEUE, {durable: true}); //durable is for data persistance: Data will survive a RabbitMq broker restart
            console.log(`Publisher asserted '${BOOKING_QUEUE}' queue.`);
        }
    } catch (err){
        console.error('Failed to connect RabbitMQ publisher:', err.message);
        process.exit(1);
    }
}

const publishToQueue = async (message) => {
   if (!channel){
        console.error('RabbitMQ channel not available. Message not published.');
        return false;
    }

    try{
        const sent = channel.sendToQueue(BOOKING_QUEUE, Buffer.from(JSON.stringify(message)), {persistent: true}); //persisten: true is used to write the queue data into disk in order to not to forget data as long as queue is durable

        if (sent){
            console.log(`[Publisher] Sent booking request ID: ${message.bookingRequestId}`);
            return true;
        } else{
            console.warn(`[Publisher] Message to '${BOOKING_QUEUE}' was not accepted by RabbitMQ (possibly flow control).`);
            return false;
        } 
    } catch(err){
        console.error(`[Publisher] Error sending message to queue: ${err.message}`);
        return false;
    }
}

const closePublisherRabbitMq = async () => {
    if (connection){
        try{
            await connection.close();
            console.log('Publisher RabbitMQ connection closed');
        } catch(err){
            console.error('Error closing publisher RabbitMQ connection:', err.message);
        }
    }
}

module.exports = {
    connectPublisherRabbitMq: connectPublisherRabbitMq,
    publishToQueue: publishToQueue,
    closePublisherRabbitMq: closePublisherRabbitMq,
};