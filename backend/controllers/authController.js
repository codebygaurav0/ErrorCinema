
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
  isActive: user.isActive,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
});

/*
|--------------------------------------------------------------------------
| Signup
|--------------------------------------------------------------------------
*/

const signup = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token =
      generateToken(user);

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      const firstError =
        Object.values(
          error.errors
        )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid user data",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error. Please try again later.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user =
      await User.findOne({ email }).select(
        "+password"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    user.lastLogin =
      new Date();

    await user.save();

    const token =
      generateToken(user);

    return res.json({
      success: true,
      message:
        "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error. Please try again later.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

const getMe = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Get me error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error. Please try again later.",
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};