
const mongoose = require("mongoose");
const Module = require("../models/Module");
const Course = require("../models/Course");

// CREATE MODULE
const createModule = async (req, res, next) => {
  try {
    const { course, title, description, order, status } = req.body;

    if (!course || !title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: "Course ID, title and order are required",
      });
    }

    if (!mongoose.isValidObjectId(course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!Number.isInteger(Number(order)) || Number(order) < 1) {
      return res.status(400).json({
        success: false,
        message: "Order must be a positive integer",
      });
    }

    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const newModule = await Module.create({
      course,
      title,
      description,
      order: Number(order),
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      module: newModule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This module order is already used in this course",
      });
    }

    next(error);
  }
};

// GET ALL MODULES FOR A COURSE
const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const existingCourse = await Course.findById(courseId);

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const modules = await Module.find({ course: courseId })
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      count: modules.length,
      modules,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE MODULE
const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const module = await Module.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    return res.status(200).json({
      success: true,
      module,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE MODULE
const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const allowedFields = ["title", "description", "order", "status"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.order !== undefined) {
      if (
        !Number.isInteger(Number(updates.order)) ||
        Number(updates.order) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Order must be a positive integer",
        });
      }

      updates.order = Number(updates.order);
    }

    const updatedModule = await Module.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Module updated successfully",
      module: updatedModule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This module order is already used in this course",
      });
    }

    next(error);
  }
};

// DELETE MODULE
const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const deletedModule = await Module.findByIdAndDelete(id);

    if (!deletedModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
};
