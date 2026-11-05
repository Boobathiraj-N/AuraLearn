
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      introduction,
      category,
      level,
      price,
      thumbnail,
      durationMinutes,
      status,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required",
      });
    }

    const slug = generateSlug(title);

    const course = await Course.create({
      title,
      slug,
      description,
      introduction,
      category,
      level,
      price,
      thumbnail,
      durationMinutes,
      status,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};


// GET ALL COURSES (ADMIN)
const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// GET PUBLISHED COURSES (PUBLIC)
const getPublishedCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      status: "published",
    }).select(
      "title slug description introduction category level price thumbnail durationMinutes"
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE COURSE
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(id)
      .populate("createdBy", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE COURSE
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "introduction",
      "category",
      "level",
      "price",
      "thumbnail",
      "durationMinutes",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE COURSE
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


// GET PUBLIC COURSE DETAILS WITH PREVIEW LESSONS
const getPublicCourseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({
      _id: id,
      status: "published",
    }).select(
      "title slug description introduction category level price thumbnail durationMinutes"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    const modules = await Module.find({
      course: id,
      status: "published",
    })
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((module) => module._id);

    const lessons = await Lesson.find({
      module: { $in: moduleIds },
      status: "published",
    })
      .select(
        "module title description durationMinutes order isFreePreview videoUrl"
      )
      .sort({ order: 1 })
      .lean();

    const modulesWithLessons = modules.map((module) => ({
      ...module,
      lessons: lessons
        .filter(
          (lesson) =>
            lesson.module.toString() === module._id.toString()
        )
        .map((lesson) => {
          const { videoUrl, ...lessonDetails } = lesson;

          return lesson.isFreePreview
            ? lesson
            : lessonDetails;
        }),
    }));

    const totalLessons = lessons.length;

    return res.status(200).json({
      success: true,
      course,
      totalModules: modules.length,
      totalLessons,
      modules: modulesWithLessons,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createCourse,
  getAllCourses,
  getPublishedCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getPublicCourseDetails,
};
