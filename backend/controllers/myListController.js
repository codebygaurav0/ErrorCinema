const mongoose = require("mongoose");
const MyList = require("../models/MyList");
const Movie = require("../models/Movie");

const validMovieId = (movieId) => mongoose.isValidObjectId(movieId);

const getMyList = async (req, res) => {
  try {
    const items = await MyList.find({
      user: req.user._id,
    })
      .populate("movie")
      .sort({ createdAt: -1 });

    const movies = items
      .filter((item) => item.movie && item.movie.published === true)
      .map((item) => item.movie);

    return res.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("Get my list error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load My List",
    });
  }
};

const addToMyList = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!validMovieId(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await Movie.findOne({
      _id: movieId,
      published: true,
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie or series not found",
      });
    }

    const existing = await MyList.findOne({
      user: req.user._id,
      movie: movieId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Already added to My List",
      });
    }

    await MyList.create({
      user: req.user._id,
      movie: movieId,
    });

    return res.status(201).json({
      success: true,
      message: "Added to My List",
    });
  } catch (error) {
    console.error("Add to my list error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already added to My List",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add to My List",
    });
  }
};

const removeFromMyList = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!validMovieId(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const deleted = await MyList.findOneAndDelete({
      user: req.user._id,
      movie: movieId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Movie is not in My List",
      });
    }

    return res.json({
      success: true,
      message: "Removed from My List",
    });
  } catch (error) {
    console.error(
      "Remove from my list error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to remove from My List",
    });
  }
};

const checkMyList = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!validMovieId(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const item = await MyList.exists({
      user: req.user._id,
      movie: movieId,
    });

    return res.json({
      success: true,
      inMyList: Boolean(item),
    });
  } catch (error) {
    console.error(
      "Check my list error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to check My List",
    });
  }
};

module.exports = {
  getMyList,
  addToMyList,
  removeFromMyList,
  checkMyList,
};
