const express = require("express");

const {
  createMovie,
  getMovies,
  getAllMovies,
  getMovieById,
  deleteMovie,
  updateMovie,
} = require("../controllers/movieController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// Get all content - Admin
router.get("/admin/all", protect, adminOnly, getAllMovies);

// Get single content including Draft - Admin
router.get("/admin/:id", protect, adminOnly, getMovieById);


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get all published content
router.get("/", getMovies);

// Get one published movie/series
router.get("/:id", getMovieById);


/*
|--------------------------------------------------------------------------
| Admin Write Routes
|--------------------------------------------------------------------------
*/

// Create content - Admin
router.post("/", protect, adminOnly, createMovie);

// Update content - Admin
router.put("/:id", protect, adminOnly, updateMovie);

// Delete content - Admin
router.delete("/:id", protect, adminOnly, deleteMovie);

module.exports = router;
