const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("../models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@errorcinema.com";
    const password = "Admin@123456";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.password = await bcrypt.hash(password, 12);

      await existingAdmin.save();

      console.log("Existing user promoted to admin.");
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);

      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: "ErrorCinema Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully.");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exit(1);
  }
};

createAdmin();