require("dotenv").config();

const mongoose = require("mongoose");

const Enrollment = require("../src/models/Enrollment");
const Course = require("../src/models/Course");
const Lead = require("../src/models/Lead");

const { assignLead } = require("../src/services/leadAssignment.service");

const createMissingLead = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const studentId = "6ac932a214b34308495525e8";
    const courseId = "6ada05678bb86c66b9a5f866";

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      throw new Error("Active enrollment not found");
    }

    const course = await Course.findById(courseId);

    if (!course || course.price !== 0) {
      throw new Error("Free course not found");
    }

    const existingLead = await Lead.findOne({
      enrollment: enrollment._id,
    });

    if (existingLead) {
      console.log("Lead already exists:", existingLead._id);
      return;
    }

    const lead = await Lead.create({
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
    });

    const assignment = await assignLead({
      leadId: lead._id,
      team: "support",
      reason: "initial_assignment",
    });

    console.log("Lead created successfully!");
    console.log("Lead ID:", assignment.lead._id);
    console.log("Assigned Support:", assignment.assignment.assignedTo);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createMissingLead();