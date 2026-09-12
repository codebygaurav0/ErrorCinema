const express = require("express");

const {
  getMyList,
  addToMyList,
  removeFromMyList,
  checkMyList,
} = require("../controllers/myListController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyList);

router.get(
  "/check/:movieId",
  protect,
  checkMyList
);

router.post(
  "/:movieId",
  protect,
  addToMyList
);

router.delete(
  "/:movieId",
  protect,
  removeFromMyList
);

module.exports = router;
