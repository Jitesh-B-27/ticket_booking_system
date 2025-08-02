const { get } = require("mongoose");
const moviesDAO = require("../dao/movies");

// Controller function to get a list of all movies
const getAllMovies = async (req, res) => {
    try{
        const movies = await moviesDAO.getAllMovies();
        res.status(200).json(movies);
    } catch(error){
        console.log('Error fetching movies: ', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

// Controller function to get a movie by id

const getMovieById = async (req, res) => {
    const { id } = req.params;
    try{
        const movie = await moviesDAO.getMovieById(id);
        if (!movie){
            return res.status(404).json({message: 'Movie not found'});
        }
        res.status(200).json(movie);
    } catch (error){
        console.error('Error fetching movie by ID: ', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

module.exports = {
    getAllMovies: getAllMovies,
    getMovieById: getMovieById,
};