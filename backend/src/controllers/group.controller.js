
const CourseGroup = require("../models/CourseGroup");
const GroupMembership = require("../models/GroupMembership");
const mongoose = require("mongoose");
const GroupNotification = require("../models/GroupNotification");
const User = require("../models/User");

const getMyGroups = async (req, res, next) => {
  try {
    const memberships = await GroupMembership.find({
      student: req.user.id,
      isActive: true,
    })
      .populate({
        path: "group",
        match: { isActive: true },
        populate: {
          path: "course",
          select: "title thumbnail",
        },
      })
      .sort({ updatedAt: -1 });

    const groups = memberships
      .filter((membership) => membership.group)
      .map((membership) => ({
        groupId: membership.group._id,
        groupName: membership.group.name,
        course: membership.group.course,
        memberCount: membership.group.memberCount,
        lastMessage: membership.group.lastMessage,
        lastMessageAt: membership.group.lastMessageAt,
        lastReadAt: membership.lastReadAt,
      }));

    return res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

const getMySupportGroups = async (req, res, next) => {
  try {
    const groups = await CourseGroup.find({
      assignedSupport: req.user.id,
      isActive: true,
    })
      .populate("course", "title thumbnail")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const formattedGroups = groups.map((group) => ({
      groupId: group._id,
      groupName: group.name,
      course: group.course,
      memberCount: group.memberCount,
      lastMessage: group.lastMessage,
      lastMessageAt: group.lastMessageAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedGroups.length,
      data: formattedGroups,
    });
  } catch (error) {
    next(error);
  }
};


const GroupMessage = require("../models/GroupMessage");

const getGroupMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 20)
    );

    // Check access based on user role
    let hasAccess = false;

    if (req.user.role === "student") {
      const membership = await GroupMembership.findOne({
        group: groupId,
        student: req.user.id,
        isActive: true,
      });

      hasAccess = !!membership;
    } else if (req.user.role === "support") {
      const group = await CourseGroup.findOne({
        _id: groupId,
        assignedSupport: req.user.id,
        isActive: true,
      });

      hasAccess = !!group;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this group",
      });
    }

    const totalMessages = await GroupMessage.countDocuments({
      group: groupId,
    });

    const messages = await GroupMessage.find({
      group: groupId,
    })
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


const sendGroupMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 5000 characters",
      });
    }

      // Check access based on user role
      let hasAccess = false;

      if (req.user.role === "student") {
        const membership = await GroupMembership.findOne({
          group: groupId,
          student: req.user.id,
          isActive: true,
        });

        hasAccess = !!membership;
      } else if (req.user.role === "support") {
        const group = await CourseGroup.findOne({
          _id: groupId,
          assignedSupport: req.user.id,
          isActive: true,
        });

        hasAccess = !!group;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this group",
        });
      }

      const io = req.app.get("io");

    // Check group availability
    const group = await CourseGroup.findOne({
      _id: groupId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or inactive",
      });
    }

    // Save message
    const message = await GroupMessage.create({
      group: groupId,
      sender: req.user.id,
      messageType: "text",
      content: content.trim(),
    });

    // Update group's latest message
    group.lastMessage = content.trim();
    group.lastMessageAt = message.createdAt;

    await group.save();

      // Find other active group members
      const members = await GroupMembership.find({
        group: groupId,
        isActive: true,
        student: { $ne: req.user.id },
      }).select("student");

      // Prepare notification recipients
      const recipientIds = members.map((member) =>
        member.student.toString()
      );

      // Notify all assigned support staff when a student sends a message
      if (
        req.user.role === "student" &&
        group.assignedSupport?.length > 0
      ) {
        recipientIds.push(
          ...group.assignedSupport.map((supportId) =>
            supportId.toString()
          )
        );
      }

      // Remove duplicate recipients
      const uniqueRecipients = [...new Set(recipientIds)];

      
      // Create persistent notifications
      if (uniqueRecipients.length > 0) {
        const notifications = await GroupNotification.insertMany(
          uniqueRecipients.map((recipientId) => ({
            recipient: recipientId,
            group: groupId,
            message: message._id,
            sender: req.user.id,
            notificationType: "new_message",
          }))
        );

        

        // notifications.forEach((notification) => {
        //   console.log("Emitting notification to:", notification.recipient);

        //   io.to(`user:${notification.recipient}`).emit(
        //     "new-notification",
        //     {
        //       _id: notification._id,
        //       group: groupId,
        //       message: message._id,
        //       sender: req.user.id,
        //       notificationType: "new_message",
        //       createdAt: notification.createdAt,
        //     }
        //   );

        //   console.log("Notification emitted successfully");
        // });
        notifications.forEach((notification) => {
  const roomName = `user:${notification.recipient}`;

  console.log("Notification room:", roomName);

  console.log(
    "Room sockets:",
    io.sockets.adapter.rooms.get(roomName)
  );

  io.to(roomName).emit("new-notification", {
    _id: notification._id,
    group: groupId,
    message: message._id,
    sender: req.user.id,
    notificationType: "new_message",
    createdAt: notification.createdAt,
  });

  console.log("Notification emitted successfully");
});
      }


    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name role");


    io.to(`group:${groupId}`).emit("new-message", populatedMessage);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

const uploadGroupImage = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    let hasAccess = false;

    if (req.user.role === "student") {
      const membership = await GroupMembership.findOne({
        group: groupId,
        student: req.user.id,
        isActive: true,
      });

      hasAccess = !!membership;
    } else if (req.user.role === "support") {
      const group = await CourseGroup.findOne({
        _id: groupId,
        assignedSupport: req.user.id,
        isActive: true,
      });

      hasAccess = !!group;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this group",
      });
    }

    const group = await CourseGroup.findOne({
      _id: groupId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or inactive",
      });
    }

    const uploadToCloudinary = require("../utils/uploadToCloudinary");

    const uploadedImage = await uploadToCloudinary(req.file.buffer);

    const message = await GroupMessage.create({
      group: groupId,
      sender: req.user.id,
      messageType: "image",
      image: {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      },
    });

    group.lastMessage = "📷 Image";
    group.lastMessageAt = message.createdAt;
    await group.save();


    // Find other active group members
    const members = await GroupMembership.find({
      group: groupId,
      isActive: true,
      student: { $ne: req.user.id },
    }).select("student");

    const io = req.app.get("io");

    // Prepare notification recipients
    const recipientIds = members.map((member) =>
      member.student.toString()
    );

    // Notify all assigned support staff when a student sends an image
    if (
      req.user.role === "student" &&
      group.assignedSupport?.length > 0
    ) {
      recipientIds.push(
        ...group.assignedSupport.map((supportId) =>
          supportId.toString()
        )
      );
    }

    // Remove duplicate recipients
    const uniqueRecipients = [...new Set(recipientIds)];

    // Create persistent notifications
    if (uniqueRecipients.length > 0) {
      const notifications = await GroupNotification.insertMany(
        uniqueRecipients.map((recipientId) => ({
          recipient: recipientId,
          group: groupId,
          message: message._id,
          sender: req.user.id,
          notificationType: "new_message",
        }))
      );

      notifications.forEach((notification) => {
        console.log("Emitting notification to:", notification.recipient);

        io.to(`user:${notification.recipient}`).emit(
          "new-notification",
          {
            _id: notification._id,
            group: groupId,
            message: message._id,
            sender: req.user.id,
            notificationType: "new_message",
            createdAt: notification.createdAt,
          }
        );
        console.log("Notification emitted successfully");

      });
    }

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name role");

    // Broadcast image to group members
    io.to(`group:${groupId}`).emit("new-message", populatedMessage);
    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

const getAllGroups = async (req, res, next) => {
  try {
    const groups = await CourseGroup.find({ isActive: true })
      .populate("course", "title thumbnail")
      .populate("assignedSupport", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSupportStaff = async (req, res, next) => {
  try {
    const supportStaff = await User.find({
      role: "support",
      isActive: true,
    })
      .select("name email")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: supportStaff.length,
      data: supportStaff,
    });
  } catch (error) {
    next(error);
  }
};



const assignSupportToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { supportIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    if (
      !Array.isArray(supportIds) ||
      supportIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one support staff",
      });
    }

    // Validate support IDs
    const invalidIds = supportIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds) {
      return res.status(400).json({
        success: false,
        message: "Invalid support staff ID",
      });
    }

    // Remove duplicate IDs
    const uniqueSupportIds = [
      ...new Set(supportIds.map((id) => id.toString())),
    ];

    // Check all selected users are active support staff
    const supportUsers = await mongoose.model("User").find({
      _id: { $in: uniqueSupportIds },
      role: "support",
      isActive: true,
    });

    if (supportUsers.length !== uniqueSupportIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more active support staff not found",
      });
    }

    const group = await CourseGroup.findOneAndUpdate(
      {
        _id: groupId,
        isActive: true,
      },
      {
        $set: {
          assignedSupport: uniqueSupportIds,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("assignedSupport", "name email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support staff assigned successfully",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  getMyGroups,
  getMySupportGroups,
  getGroupMessages,
  sendGroupMessage,
  uploadGroupImage,
  assignSupportToGroup,
  getAllGroups,
  getActiveSupportStaff,
};
