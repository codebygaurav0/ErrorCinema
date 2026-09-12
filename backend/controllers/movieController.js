const mongoose = require("mongoose");
const Movie = require("../models/Movie");

const isValidMovieId = (id) => mongoose.isValidObjectId(id);

// Create Movie - Admin
const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {
    console.error("Create movie error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all published movies
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ published: true }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("Get movies error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
    });
  }
};

// Get all movies - Admin
const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("Get all movies error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
    });
  }
};

// Get single movie
const getMovieById = async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    if (!movie.published && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error("Get movie error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid movie ID",
    });
  }
};

// Update Movie - Admin
const updateMovie = async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error("Update movie error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Movie - Admin
const deleteMovie = async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error("Delete movie error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid movie ID",
    });
  }
};

module.exports = {
  createMovie,
  getMovies,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
};