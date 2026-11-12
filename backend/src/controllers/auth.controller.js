const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { generateOtp, hashOtp, sendOtp } = require("../services/otp.service");
const {
  sendPasswordResetEmail,
} = require("../utils/emailService");

const registerStudent = async (req, res, next) => {
  let challenge;

  try {
    const { name, email, password, profileType, mobile } = req.body;

    if (!name || !email || !password || !profileType || !mobile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
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

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8 to 72 characters",
      });
    }

    if (!["student", "working", "fresher"].includes(profileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile type",
      });
    }

    // Require international format, e.g. +919876543210.
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Use mobile number in international format, e.g. +919876543210",
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

    const otp = generateOtp();
    const otpHash = hashOtp(normalizedMobile, otp);
    const passwordHash = await bcrypt.hash(password, 12);

    // Remove any previous unverified registration for this email/mobile.
    await OtpChallenge.deleteMany({
      $or: [
        { email: normalizedEmail },
        { mobile: normalizedMobile },
      ],
    });

    challenge = await OtpChallenge.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      mobile: normalizedMobile,
      profileType,
      otpHash,
      expiresAt: new Date(
        Date.now() +
          Number(process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000
      ),
    });

    const delivery = await sendOtp(normalizedMobile, otp);

    return res.status(200).json({
      success: true,
      message: "OTP generated. Verify your mobile number to complete registration.",
      ...(delivery.developmentOtp
        ? { developmentOtp: delivery.developmentOtp }
        : {}),
    });
  } catch (error) {
    if (challenge) {
      await OtpChallenge.deleteOne({ _id: challenge._id }).catch(() => {});
    }

    next(error);
  }
};

const verifyStudentOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (
      typeof mobile !== "string" ||
      typeof otp !== "string" ||
      !/^\+[1-9]\d{7,14}$/.test(mobile.trim()) ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid mobile number and 6-digit OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    const challenge = await OtpChallenge.findOne({
      mobile: normalizedMobile,
    }).select("+otpHash +passwordHash");

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP request",
      });
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await OtpChallenge.deleteOne({ _id: challenge._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    if (challenge.attempts >= 5) {
      await OtpChallenge.deleteOne({ _id: challenge._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please register again.",
      });
    }

    const submittedHash = hashOtp(normalizedMobile, otp);

    const hashesMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(challenge.otpHash, "hex")
    );

    if (!hashesMatch) {
      challenge.attempts += 1;

      if (challenge.attempts >= 5) {
        await OtpChallenge.deleteOne({ _id: challenge._id });

        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. Please register again.",
        });
      }

      await challenge.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
        attemptsRemaining: 5 - challenge.attempts,
      });
    }

    const user = await User.create({
      name: challenge.name,
      email: challenge.email,
      password: challenge.passwordHash,
      mobile: challenge.mobile,
      profileType: challenge.profileType,
      role: "student",
      isMobileVerified: true,
      isActive: true,
    });

    await OtpChallenge.deleteOne({ _id: challenge._id });

    return res.status(201).json({
      success: true,
      message: "Mobile verified and student account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileType: user.profileType,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const token = require("jsonwebtoken").sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const activateStaff = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Activation token and password are required",
      });
    }

    if (typeof token !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Token and password must be strings",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8 to 72 characters",
      });
    }

    // Hash the token received from the activation link
    const activationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find a matching, unexpired activation token
    const user = await User.findOne({
      activationTokenHash,
      activationTokenExpiry: { $gt: new Date() },
      role: { $in: ["support", "sales"] },
      isActive: false,
    }).select("+activationTokenHash +activationTokenExpiry");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation link",
      });
    }

    // Hash the new password
    user.password = await bcrypt.hash(password, 12);

    // Activate account and invalidate the token
    user.isActive = true;
    user.activationTokenHash = undefined;
    user.activationTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Staff account activated successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    // Don't reveal whether the email exists.
    const response = {
      success: true,
      message:
        "If an active account exists with this email, a password reset link will be sent.",
    };

    if (!user) {
      return res.status(200).json(response);
    }

    // Generate secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash.
    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordTokenHash = resetPasswordTokenHash;
    user.resetPasswordTokenExpiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is missing");
    }

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      // Remove reset token if email delivery fails.
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordTokenExpiry = undefined;
      await user.save();

      throw emailError;
    }

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    if (typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8 to 72 characters",
      });
    }

    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash,
      resetPasswordTokenExpiry: { $gt: new Date() },
      isActive: true,
    }).select(
      "+resetPasswordTokenHash +resetPasswordTokenExpiry"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    user.password = await bcrypt.hash(password, 12);

    // Invalidate reset token after successful password reset.
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "New password must contain 8 to 72 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found or account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate any outstanding password reset link.
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  verifyStudentOtp,
  loginUser,
  activateStaff,
  forgotPassword,
  resetPassword,
  changePassword,
};