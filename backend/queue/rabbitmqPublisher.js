const amqp = require("amqplib");
const dotenv = require("dotenv");

dotenv.config();
let channel = null;

const connectPublisherRabbitMq = async () => {
    try{
        const conn = await amqp.connect(process.env.RABBITMQ_URI);
        channel = await conn.createChannel();
        const queue = 'booking_requests';
        await channel.assertQueue(queue, {
            durable: true // The queue will survive a RabbitMQ restart
        });
        console.log("RabbitMQ Publisher connected and queue asserted");
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

    const queue = 'booking_requests';
    try{
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true //persistent: true is used to write the queue data into disk in order to not to forget data as long as queue is durable
        }); 

        console.log(`[Publisher] sent booking request id: ${message.bookingRequestId}`);
        return true;
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