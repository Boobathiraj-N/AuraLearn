
require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./src/models/User");
const mongoose = require("mongoose");
const CourseGroup = require("./src/models/CourseGroup");
const GroupMembership = require("./src/models/GroupMembership");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Socket.io JWT Authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found or account is inactive"));
    }

    socket.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired authentication token"));
  }
});

// Socket connection event
io.on("connection", (socket) => {
  console.log(
    `User connected: ${socket.user.id} (${socket.user.role})`
  );

    io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join personal notification room
    socket.join(`user:${socket.user.id}`);

    console.log(`User joined personal room: user:${socket.user.id}`);

    // Existing socket events continue here...
  });

  // Join course group room
  socket.on("join-group", async ({ groupId }, callback) => {
    try {
      if (socket.user.role !== "student") {
        return callback?.({
          success: false,
          message: "Only students can join group rooms",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return callback?.({
          success: false,
          message: "Invalid group ID",
        });
      }

      // Check group availability
      const group = await CourseGroup.findOne({
        _id: groupId,
        isActive: true,
      });

      if (!group) {
        return callback?.({
          success: false,
          message: "Group not found or inactive",
        });
      }

      // Check student membership
      const membership = await GroupMembership.findOne({
        group: groupId,
        student: socket.user.id,
        isActive: true,
      });

      if (!membership) {
        return callback?.({
          success: false,
          message: "You are not a member of this group",
        });
      }

      // Join Socket.io room
      socket.join(`group:${groupId}`);

      console.log(
        `User ${socket.user.id} joined group ${groupId}`
      );

      callback?.({
        success: true,
        message: "Successfully joined group",
      });
    } catch (error) {
      console.error("Group join error:", error);

      callback?.({
        success: false,
        message: "Failed to join group",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.io is ready");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
