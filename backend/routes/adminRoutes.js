const express = require("express");
const Movie = require("../models/Movie");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {
    const [
      totalMovies,
      totalSeries,
      publishedMovies,
      draftMovies,
      publishedSeries,
      draftSeries,
      featuredContent,
      publishedContent,
      draftContent,
      viewsResult,
      recentMovies,
      recentSeries,
    ] = await Promise.all([
      Movie.countDocuments({ type: "movie" }),
      Movie.countDocuments({ type: "series" }),
      Movie.countDocuments({ type: "movie", published: true }),
      Movie.countDocuments({ type: "movie", published: false }),
      Movie.countDocuments({ type: "series", published: true }),
      Movie.countDocuments({ type: "series", published: false }),
      Movie.countDocuments({ featured: true }),
      Movie.countDocuments({ published: true }),
      Movie.countDocuments({ published: false }),
      Movie.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
          },
        },
      ]),
      Movie.find({ type: "movie" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title poster type year rating duration published featured views createdAt"),
      Movie.find({ type: "series" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title poster type year rating duration published featured views createdAt"),
    ]);

    const totalViews = viewsResult[0]?.totalViews || 0;

    res.json({
      success: true,
      message: "Welcome to ErrorCinema Admin Dashboard",

      admin: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },

      stats: {
        totalMovies,
        totalSeries,
        totalContent: totalMovies + totalSeries,
        publishedMovies,
        draftMovies,
        publishedSeries,
        draftSeries,
        publishedContent,
        draftContent,
        featuredContent,
        totalViews,
      },

      recentMovies,
      recentSeries,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
});

module.exports = router;
