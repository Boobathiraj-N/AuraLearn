
const mongoose = require("mongoose");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

// GET STUDENT'S COURSE PROGRESS
const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    }).populate({
        path: "completedChallenges",
        select:
          "lesson title description difficulty language starterCode points status createdAt updatedAt",
      })

    if (!progress) {
      progress = await Progress.create({
        student: studentId,
        course: courseId,
      });
    }

    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

// MARK LESSON AS COMPLETED
const completeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lessonId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID or lesson ID",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Ensure the lesson belongs to this course
    const Module = require("../models/Module");
    const lessonModule = await Module.findById(lesson.module);

    if (
      !lessonModule ||
      lessonModule.course.toString() !== courseId
    ) {
      return res.status(400).json({
        success: false,
        message: "Lesson does not belong to this course",
      });
    }

    let progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        student: studentId,
        course: courseId,
      });
    }

    const alreadyCompleted = progress.completedLessons.some(
      (id) => id.toString() === lessonId
    );

    if (!alreadyCompleted) {
      progress.completedLessons.push(lessonId);
    }

    const modules = await Module.find({ course: courseId }).select("_id");
    const moduleIds = modules.map((item) => item._id);

    const totalLessons = await Lesson.countDocuments({
      module: { $in: moduleIds },
      status: "published",
    });

    const completedPublishedLessons = await Lesson.countDocuments({
      _id: { $in: progress.completedLessons },
      module: { $in: moduleIds },
      status: "published",
    });

    progress.progressPercentage =
      totalLessons === 0
        ? 0
        : Math.round(
            (completedPublishedLessons / totalLessons) * 100
          );

    progress.lastAccessedAt = new Date();

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      progress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourseProgress,
  completeLesson,
};
