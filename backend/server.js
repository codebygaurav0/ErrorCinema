const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const movieRoutes = require("./routes/movieRoutes");
const myListRoutes = require("./routes/myListRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

connectDB();

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/my-list", myListRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ErrorCinema API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

app.listen(PORT, () => {
  console.log(
    `ErrorCinema server running on http://localhost:${PORT}`
  );
});
