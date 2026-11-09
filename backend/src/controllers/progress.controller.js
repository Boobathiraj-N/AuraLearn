
const mongoose = require("mongoose");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

const Module = require("../models/Module");
const Enrollment = require("../models/Enrollment");
const Lead = require("../models/Lead");

const { assignLead } = require("../services/leadAssignment.service");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const path = require("path");

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


// GET COURSE COMPLETION CERTIFICATE
const getCourseCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    })
      .populate("student", "name email")
      .populate("course", "title");

    if (!progress || progress.progressPercentage !== 100 || !progress.certificateId) {
      return res.status(403).json({
        success: false,
        message: "Complete the course to unlock your certificate",
      });
    }

    return res.status(200).json({
      success: true,
      certificate: {
        certificateId: progress.certificateId,
        studentName: progress.student.name,
        courseName: progress.course.title,
        issuedAt: progress.certificateIssuedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


// MARK LESSON AS COMPLETED

const completeLesson = async (req, res, next) => {
  const session = await mongoose.startSession();

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

    let result;

    await session.withTransaction(async () => {
      const course = await Course.findById(courseId).session(session);

      if (!course) {
        const error = new Error("Course not found");
        error.statusCode = 404;
        throw error;
      }

      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
        status: "active",
      }).session(session);

      if (!enrollment) {
        const error = new Error("Active course enrollment not found");
        error.statusCode = 403;
        throw error;
      }

      const lesson = await Lesson.findById(lessonId).session(session);

      if (!lesson) {
        const error = new Error("Lesson not found");
        error.statusCode = 404;
        throw error;
      }

      const lessonModule = await Module.findOne({
        _id: lesson.module,
        course: courseId,
      }).session(session);

      if (!lessonModule) {
        const error = new Error("Lesson does not belong to this course");
        error.statusCode = 400;
        throw error;
      }

      let progress = await Progress.findOne({
        student: studentId,
        course: courseId,
      }).session(session);

      if (!progress) {
        const error = new Error("Course progress not found");
        error.statusCode = 404;
        throw error;
      }

      const alreadyCompleted = progress.completedLessons.some(
        (id) => id.toString() === lessonId
      );

      if (!alreadyCompleted) {
        progress.completedLessons.push(lessonId);
      }

      const modules = await Module.find({ course: courseId })
        .select("_id")
        .session(session);

      const moduleIds = modules.map((item) => item._id);

      const totalLessons = await Lesson.countDocuments({
        module: { $in: moduleIds },
        status: "published",
      }).session(session);

      const completedPublishedLessons = await Lesson.countDocuments({
        _id: { $in: progress.completedLessons },
        module: { $in: moduleIds },
        status: "published",
      }).session(session);

      progress.progressPercentage =
        totalLessons === 0
          ? 0
          : Math.round(
              (completedPublishedLessons / totalLessons) * 100
            );

      progress.lastAccessedAt = new Date();

      // Generate certificate when course reaches 100%
      if (
        progress.progressPercentage === 100 &&
        !progress.certificateId
      ) {
        progress.certificateId = `AL-${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase()}`;

        progress.certificateIssuedAt = new Date();
      }

      await progress.save({ session });

      let handoff = null;

      if (
        course.price === 0 &&
        progress.progressPercentage === 100
      ) {
        const lead = await Lead.findOne({
          enrollment: enrollment._id,
          currentTeam: "support",
        }).session(session);

        if (lead) {
          const assignment = await assignLead({
            leadId: lead._id,
            team: "sales",
            reason: "team_transfer",
            session,
          });

          await Lead.findByIdAndUpdate(
            lead._id,
            {
              $set: {
                transferredAt: new Date(),
              },
            },
            { session }
          );

          handoff = {
            team: "sales",
            assignedTo: assignment.assignment.assignedTo,
          };
        }
      }

      result = { progress, handoff };
    });

    return res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      ...result,
    });
  } catch (error) {
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

// DOWNLOAD COURSE CERTIFICATE PDF
const downloadCourseCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    })
      .populate("student", "name")
      .populate("course", "title");

    if (
      !progress ||
      progress.progressPercentage !== 100 ||
      !progress.certificateId
    ) {
      return res.status(403).json({
        success: false,
        message: "Complete the course to download your certificate",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${progress.certificateId}.pdf`
    );

    const logoPath = path.join(
  __dirname,
  "../assets/auralearn-logo.png"
);

    doc.image(logoPath, 360, 45, {
      width: 80,
    });

    doc.pipe(res);

    // Certificate design
    doc.rect(20, 20, 802, 555).lineWidth(4).stroke("#D4AF37");

    doc
      .fontSize(32)
      .fillColor("#1E3A8A")
      .text("CERTIFICATE OF COMPLETION", 50, 100, {
        align: "center",
      });

    doc
      .fontSize(18)
      .fillColor("#333333")
      .text("This certificate is proudly presented to", 50, 190, {
        align: "center",
      });

    doc
      .fontSize(30)
      .fillColor("#111827")
      .text(progress.student.name, 50, 240, {
        align: "center",
      });

    doc
      .fontSize(18)
      .fillColor("#333333")
      .text("For successfully completing the course", 50, 300, {
        align: "center",
      });

    doc
      .fontSize(24)
      .fillColor("#1E3A8A")
      .text(progress.course.title, 50, 345, {
        align: "center",
      });

    doc
      .fontSize(12)
      .fillColor("#555555")
      .text(
        `Certificate ID: ${progress.certificateId}`,
        50,
        440,
        { align: "center" }
      );

    doc.text(
      `Completion Date: ${new Date(
        progress.certificateIssuedAt
      ).toLocaleDateString("en-IN")}`,
      50,
      465,
      { align: "center" }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getCourseProgress,
  completeLesson,
  getCourseCertificate,
  downloadCourseCertificate,
};
