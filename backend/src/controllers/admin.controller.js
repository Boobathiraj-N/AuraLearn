const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const { sendStaffActivationEmail } = require("../utils/emailService");

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

        const frontendUrl =
          process.env.FRONTEND_URL || "http://localhost:5173";

        const activationUrl =
          `${frontendUrl}/portal/set-password?token=${activationToken}`;

        try {
          await sendStaffActivationEmail({
            email: staff.email,
            name: staff.name,
            role: staff.role,
            activationUrl,
          });
        } catch (emailError) {
          // Email send aagala na, incomplete staff record-ai remove pannuvom
          await User.findByIdAndDelete(staff._id);
          throw emailError;
        }

        return res.status(201).json({
          success: true,
          message: "Staff account created. Activation email sent successfully.",
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

const getAllStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      role: { $in: ["support", "sales"] },
    })
      .select("name email mobile role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: { $in: ["support", "sales"] },
    })
      .select("name email mobile role profileType isActive isMobileVerified createdAt")
      .lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    next(error);
  }
};


const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, role } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    // At least one field must be provided
    if (
      name === undefined &&
      email === undefined &&
      mobile === undefined &&
      role === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: { $in: ["support", "sales"] },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be a string",
        });
      }

      const normalizedName = name.trim();

      if (normalizedName.length < 2 || normalizedName.length > 80) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 80 characters",
        });
      }

      updates.name = normalizedName;
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be a string",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
      }

      updates.email = normalizedEmail;
    }

    if (mobile !== undefined) {
      if (typeof mobile !== "string") {
        return res.status(400).json({
          success: false,
          message: "Mobile must be a string",
        });
      }

      const normalizedMobile = mobile.trim();

      if (!/^\+[1-9]\d{7,14}$/.test(normalizedMobile)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid international mobile number",
        });
      }

      updates.mobile = normalizedMobile;
    }

    if (role !== undefined) {
      if (!["support", "sales"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Role must be support or sales",
        });
      }

      updates.role = role;
    }

    // Prevent duplicate email or mobile
    const duplicateConditions = [];

    if (updates.email) {
      duplicateConditions.push({ email: updates.email });
    }

    if (updates.mobile) {
      duplicateConditions.push({ mobile: updates.mobile });
    }

    if (duplicateConditions.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: staff._id },
        $or: duplicateConditions,
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or mobile number already registered",
        });
      }
    }

    Object.assign(staff, updates);
    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff profile updated successfully",
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


const updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: { $in: ["support", "sales"] },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    staff.isActive = isActive;
    await staff.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Staff account activated successfully"
        : "Staff account deactivated successfully",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
};