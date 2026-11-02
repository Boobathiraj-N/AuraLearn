const mongoose = require("mongoose");

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const Lead = require("../models/Lead");

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

module.exports = { enrollCourse };