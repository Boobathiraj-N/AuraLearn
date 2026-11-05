const mongoose = require("mongoose");

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const Lead = require("../models/Lead");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");

const { assignLead } = require("../services/leadAssignment.service");

const enrollCourse = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    let result;

    await session.withTransaction(async () => {
      const course = await Course.findOne({
        _id: courseId,
        status: "published",
      }).session(session);

      if (!course) {
        const error = new Error("Published course not found");
        error.statusCode = 404;
        throw error;
      }

      const existingEnrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
      }).session(session);

      // Paid courses must go through Razorpay payment
      if (course.price > 0) {
        const error = new Error(
          "Paid courses require verified payment"
        );
        error.statusCode = 403;
        throw error;
      }

      if (existingEnrollment) {
        const error = new Error("Already enrolled in this course");
        error.statusCode = 409;
        throw error;
      }

      const [enrollment] = await Enrollment.create(
        [{ student: studentId, course: courseId }],
        { session }
      );

      await Progress.create(
        [{ student: studentId, course: courseId }],
        { session }
      );

      // Create CRM lead only for free courses
      if (course.price === 0) {
        const [lead] = await Lead.create(
          [
            {
              student: studentId,
              course: courseId,
              enrollment: enrollment._id,
            },
          ],
          { session }
        );

        const assignment = await assignLead({
          leadId: lead._id,
          team: "support",
          reason: "initial_assignment",
          session,
        });

        result = {
          enrollment,
          lead: assignment.lead,
          assignedStaff: assignment.assignment.assignedTo,
        };
      } else {
        result = { enrollment };
      }
    });

    return res.status(201).json({
      success: true,
      message: "Course enrollment successful",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already enrolled in this course",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

// GET LOGGED-IN STUDENT'S COURSES
const getMyCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.find({
      student: studentId,
      status: { $in: ["active", "completed"] },
    })
      .populate(
        "course",
        "title slug description thumbnail category level price durationMinutes"
      )
      .sort({ enrolledAt: -1 })
      .lean();

    const courseIds = enrollments.map(
      (enrollment) => enrollment.course?._id
    ).filter(Boolean);

    const progresses = await Progress.find({
      student: studentId,
      course: { $in: courseIds },
    }).lean();

    const progressMap = new Map(
      progresses.map((progress) => [
        progress.course.toString(),
        progress,
      ])
    );

    const myCourses = enrollments.map((enrollment) => ({
      ...enrollment,
      progress: progressMap.get(
        enrollment.course._id.toString()
      ) || null,
    }));

    return res.status(200).json({
      success: true,
      count: myCourses.length,
      courses: myCourses,
    });
  } catch (error) {
    next(error);
  }
};

// GET ENROLLED COURSE CONTENT FOR STUDENT
const getEnrolledCourseContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Check student enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Please enroll in this course to access lessons",
      });
    }

    // Get published course
    const course = await Course.findOne({
      _id: courseId,
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

    // Get published modules
    const modules = await Module.find({
      course: courseId,
      status: "published",
    })
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((module) => module._id);

    // Get published lessons
    const lessons = await Lesson.find({
      module: { $in: moduleIds },
      status: "published",
    })
      .sort({ order: 1 })
      .lean();

    // Attach lessons to their modules
    const modulesWithLessons = modules.map((module) => ({
      ...module,
      lessons: lessons.filter(
        (lesson) =>
          lesson.module.toString() === module._id.toString()
      ),
    }));

    return res.status(200).json({
      success: true,
      course,
      enrollment,
      modules: modulesWithLessons,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollCourse,
  getMyCourses,
  getEnrolledCourseContent,
};