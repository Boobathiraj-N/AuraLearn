
const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseGroup",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },

    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    image: {
      url: {
        type: String,
        default: null,
      },

      publicId: {
        type: String,
        default: null,
      },
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validate message content
groupMessageSchema.pre("validate", function () {
  if (this.messageType === "text" && !this.content?.trim()) {
    this.invalidate("content", "Text message cannot be empty");
  }

  if (
    this.messageType === "image" &&
    (!this.image?.url || !this.image?.publicId)
  ) {
    this.invalidate("image", "Valid image details are required");
  }
});

// Fetch group messages chronologically
groupMessageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);
