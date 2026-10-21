require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MOBILE } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_MOBILE) {
      throw new Error("Admin environment variables are required");
    }

    if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
      throw new Error("Admin password must contain 8 to 72 characters");
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await User.findOne({
      $or: [{ email }, { mobile: ADMIN_MOBILE.trim() }],
    });

    if (existingAdmin) {
      throw new Error("An account with this email or mobile already exists");
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      mobile: ADMIN_MOBILE.trim(),
      profileType: "working",
      role: "admin",
      isMobileVerified: true,
      isActive: true,
    });

    console.log("Initial admin account created successfully");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();