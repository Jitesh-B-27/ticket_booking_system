const bookingsDAO = require("../dao/bookings");
const { publishToQueue } = require("../queue/rabbitmqPublisher");
const { v4: uuidv4 } = require("uuid");

const createBooking = async (req, res) => {
    const { userId, showtimeId, seatId } = req.body;

    if (!userId || !showtimeId || !seatId){
        return res.status(400).json({message: 'Missing required booking information.'});
    }

    const bookingRequestId = uuidv4();

    try{
        const newBooking = await bookingsDAO.createPendingBooking(bookingRequestId, userId, showtimeId, seatId);

        const bookingMessage = {
            bookingRequestId: newBooking.id,
            userId: newBooking.user_id,
            showtimeId: newBooking.showtime_id,
            seatId: newBooking.seat_id,
        };

        const published = await publishToQueue(bookingMessage);

        if (!published){
            console.error(`[API] Failed to publish booking request ID ${bookingRequestId}.`);
            return res.status(500).json({
                message: 'Booking request failed to be queued. Please try again or contact support',
                bookingId: newBooking.id,
                status: 'FAILED_PUBLISH'
            });
        }

        res.status(202).json({
            message: 'Booking request recieved and is being processed.',
            bookingId: newBooking.id,
            status: 'PENDING'
        });
    } catch (error){
        console.error('Error in createBooking: ', error);
        res.status(500).json({message: 'Server error initiating booking request.'});
    }
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