
const mongoose = require("mongoose");
const Challenge = require("../models/Challenge");
const Lesson = require("../models/Lesson");

// CREATE CHALLENGE
const createChallenge = async (req, res, next) => {
  try {
    const {
      lesson,
      title,
      description,
      difficulty,
      language,
      starterCode,
      testCases,
      points,
      status,
    } = req.body;

    if (!lesson || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Lesson, title and description are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lesson)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const existingLesson = await Lesson.findById(lesson);

    if (!existingLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    if (testCases !== undefined && !Array.isArray(testCases)) {
      return res.status(400).json({
        success: false,
        message: "Test cases must be an array",
      });
    }

    const challenge = await Challenge.create({
      lesson,
      title,
      description,
      difficulty,
      language,
      starterCode,
      testCases,
      points,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      challenge,
    });
  } catch (error) {
    next(error);
  }
};

// GET CHALLENGES FOR A LESSON
const getChallengesByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const existingLesson = await Lesson.findById(lessonId);

    if (!existingLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const challenges = await Challenge.find({
      lesson: lessonId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: challenges.length,
      challenges,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE CHALLENGE
const getChallengeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID",
      });
    }

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    return res.status(200).json({
      success: true,
      challenge,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE CHALLENGE
const updateChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "difficulty",
      "language",
      "starterCode",
      "testCases",
      "points",
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
      updates.testCases !== undefined &&
      !Array.isArray(updates.testCases)
    ) {
      return res.status(400).json({
        success: false,
        message: "Test cases must be an array",
      });
    }

    const challenge = await Challenge.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challenge updated successfully",
      challenge,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE CHALLENGE
const deleteChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge ID",
      });
    }

    const challenge = await Challenge.findByIdAndDelete(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challenge deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChallenge,
  getChallengesByLesson,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
};
