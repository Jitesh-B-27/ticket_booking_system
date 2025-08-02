const showtimesDAO = require("../dao/showtimes");
const theaterDAO = require("../dao/theaters");

const getShowtimesForMovie = async (req, res) => {
    const { movieId } = req.params;
    try{
        console.log(`Fetching showtimes for movieId: ${movieId}`); 
        const showtimes = await showtimesDAO.getShowtimesForMovie(movieId);
        res.status(200).json(showtimes);
    } catch (error){
        console.error('Error fetching showtimes for movie: ', error);
        res.status(500).json({ message: 'Internal server error'});
    }
};

const getSeatsForShowTime = async (req, res) => {
    const { showtimeId } = req.params;
    try{ 
        const seats = await theaterDAO.getSeatsForShowTime(showtimeId);
        res.status(200).json(seats);
    } catch (error){
        console.error('Error fetching seats for showtime:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getShowtimesForMovie: getShowtimesForMovie,
    getSeatsForShowTime: getSeatsForShowTime,
};