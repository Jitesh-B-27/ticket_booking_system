const express = require("express");
const cors = require('cors');
const { connectPublisherRabbitMq } = require("./queue/rabbitmqPublisher");
const db = require("./db/index");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const apiRoutes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

async function connectAndStart() {
    try{
        await db.query('SELECT 1');
        console.log('PostgreSQL connected successfully via Connection Pool');

        console.log("RabbitMQ Publisher Connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on Port: ${PORT}`);
        });
    } catch(err){
        console.error("FATAL ERROR: Failed to connect to PostgreSQL. Exiting.", err);
        process.exit(1);
    }
}

connectAndStart();

app.get("/", (req, res) => {
    res.send("Concert Ticket Booking API is Running");
});

/*app.use('/api', bookingRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke on the server");
}) */