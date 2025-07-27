const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
require("dotenv").config();

const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Concert Ticket Booking API is Running");
});

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Mongo Db Connected Successfully"))
.catch(err => console.log(err));

app.use('/api', bookingRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke on the server");
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on Port: ${PORT}`);
});