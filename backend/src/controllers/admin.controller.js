const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");

const createStaff = async (req, res, next) => {
  try {
    const { name, email, role, mobile } = req.body;

    if (!name || !email || !role || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, role and mobile are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 80 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid international mobile number",
      });
    }

    if (!["support", "sales"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be support or sales",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile: normalizedMobile },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or mobile number already registered",
      });
    }

    // // Temporary random password; staff will set their own password
    // // through the activation flow implemented in the next step.
    // const temporaryPassword = crypto.randomBytes(32).toString("hex");
    // const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // const staff = await User.create({
    //   name: normalizedName,
    //   email: normalizedEmail,
    //   password: passwordHash,
    //   mobile: normalizedMobile,
    //   profileType: "working",
    //   role,
    //   isMobileVerified: false,
    //   isActive: false,
    // });
        const temporaryPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        // Generate a secure activation token
        const activationToken = crypto.randomBytes(32).toString("hex");

        // Store only the token hash in MongoDB
        const activationTokenHash = crypto
        .createHash("sha256")
        .update(activationToken)
        .digest("hex");

        // Token expires in 15 minutes
        const activationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

        const staff = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: passwordHash,
        mobile: normalizedMobile,
        profileType: "working",
        role,
        isMobileVerified: false,
        isActive: false,
        activationTokenHash,
        activationTokenExpiry,
        });

    return res.status(201).json({
      success: true,
      message: "Staff account created. Activation is pending.",
      activationUrl: `http://localhost:5173/portal/set-password?token=${activationToken}`,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStaff };