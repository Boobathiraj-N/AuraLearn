
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");

// CREATE LESSON
const createLesson = async (req, res, next) => {
  try {
    const {
      module,
      title,
      description,
      videoUrl,
      durationMinutes,
      order,
      isFreePreview,
      status,
    } = req.body;

    if (!module || !title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: "Module, title and order are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(module)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    if (!Number.isInteger(Number(order)) || Number(order) < 1) {
      return res.status(400).json({
        success: false,
        message: "Order must be a positive integer",
      });
    }

    const existingModule = await Module.findById(module);

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    const lesson = await Lesson.create({
      module,
      title,
      description,
      videoUrl,
      durationMinutes,
      order,
      isFreePreview,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      lesson,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This lesson order already exists in this module",
      });
    }

    next(error);
  }
};

// GET ALL LESSONS IN A MODULE
const getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const existingModule = await Module.findById(moduleId);

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    const lessons = await Lesson.find({
      module: moduleId,
    }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE LESSON
const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE LESSON
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "videoUrl",
      "durationMinutes",
      "order",
      "isFreePreview",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (
      updates.order !== undefined &&
      (!Number.isInteger(Number(updates.order)) ||
        Number(updates.order) < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Order must be a positive integer",
      });
    }

    const lesson = await Lesson.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      lesson,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This lesson order already exists in this module",
      });
    }

    next(error);
  }
};

// DELETE LESSON
const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findByIdAndDelete(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson,
};
