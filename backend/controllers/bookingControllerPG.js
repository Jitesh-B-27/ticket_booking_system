const bookingsDAO = require("../dao/bookings");

const createBooking = async (req, res) => {
    const { userId, showtimeId, seatId } = req.body;
    res.status(202).json({
        message: 'Booking request recieved and is being processed.',
        tempId: 'TBD'
    });
};

const getBookingStatus = async (req, res) => {
    const { bookingId } = req.params;

    try{
        const bookingDetails = await bookingsDAO.getBookingStatus(bookingId);
        if (!bookingDetails){
            return res.status(404).json({message: 'Booking not found'});
        }
        res.status(200).json(bookingDetails);
    } catch(error){
        console.error('Error fetching booking status: ', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

module.exports = {
    createBooking: createBooking,
    getBookingStatus: getBookingStatus,
};