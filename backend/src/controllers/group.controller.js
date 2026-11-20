
const CourseGroup = require("../models/CourseGroup");
const GroupMembership = require("../models/GroupMembership");
const mongoose = require("mongoose");
const GroupNotification = require("../models/GroupNotification");


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

      // Notify assigned support when a student sends a message
      if (
        req.user.role === "student" &&
        group.assignedSupport
      ) {
        recipientIds.push(group.assignedSupport.toString());
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

    // Notify assigned support when a student sends an image
    if (req.user.role === "student" && group.assignedSupport) {
      recipientIds.push(group.assignedSupport.toString());
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

const assignSupportToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { supportId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(supportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support ID",
      });
    }

    // Check whether the selected user is an active support staff
    const supportUser = await mongoose
      .model("User")
      .findOne({
        _id: supportId,
        role: "support",
        isActive: true,
      });

    if (!supportUser) {
      return res.status(404).json({
        success: false,
        message: "Active support staff not found",
      });
    }

    const group = await CourseGroup.findOneAndUpdate(
      {
        _id: groupId,
        isActive: true,
      },
      {
        $set: { assignedSupport: supportId },
      },
      {
        new: true,
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
};
