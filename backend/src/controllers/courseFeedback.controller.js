const mongoose = require("mongoose");
const CourseFeedback = require("../models/CourseFeedback");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// SUBMIT COURSE FEEDBACK
const submitCourseFeedback = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const studentId = req.user.id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (review && review.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review cannot exceed 1000 characters",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check student enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must enroll in this course to submit feedback",
      });
    }

    // Allow feedback only after course completion
    const Progress = require("../models/Progress");

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    });

    if (!progress || progress.progressPercentage !== 100) {
      return res.status(403).json({
        success: false,
        message: "Complete the course before submitting feedback",
      });
    }

    const existingFeedback = await CourseFeedback.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted feedback for this course",
      });
    }

    const feedback = await CourseFeedback.create({
      student: studentId,
      course: courseId,
      rating,
      review: review?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Course feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

// GET COURSE FEEDBACK
const getCourseFeedback = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
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

    const feedbacks = await CourseFeedback.find({ course: courseId })
      .populate("student", "name")
      .sort({ createdAt: -1 });

    const totalReviews = feedbacks.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              feedbacks.reduce(
                (total, feedback) => total + feedback.rating,
                0
              ) / totalReviews
            ).toFixed(1)
          );

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCourseFeedback,
  getCourseFeedback,
};