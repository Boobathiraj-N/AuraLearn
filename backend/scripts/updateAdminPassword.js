require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/User");

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!newPassword || newPassword.length < 8 || newPassword.length > 72) {
      throw new Error("Admin password must contain 8 to 72 characters");
    }

    const admin = await User.findOne({
      email,
      role: "admin",
    });

    if (!admin) {
      throw new Error("Admin account not found");
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    console.log("Admin password updated successfully");
  } catch (error) {
    console.error("Password update failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

updateAdminPassword();