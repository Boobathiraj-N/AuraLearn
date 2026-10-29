
const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const Challenge = require("../models/Challenge");
const { evaluateCode } = require("../services/codeEvaluation.service");
const Progress = require("../models/Progress");

// CREATE SUBMISSION
    const createSubmission = async (req, res, next) => {
    try {
        const { challengeId } = req.params;
        const { code, language } = req.body;
        const studentId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid challenge ID",
        });
        }

        if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({
            success: false,
            message: "Submitted code is required",
        });
        }

        const allowedLanguages = [
        "javascript",
        "python",
        "java",
        "cpp",
        ];

        if (!allowedLanguages.includes(language)) {
        return res.status(400).json({
            success: false,
            message: "Unsupported programming language",
        });
        }

        const challenge = await Challenge.findById(challengeId);

        if (!challenge || challenge.status !== "published") {
        return res.status(404).json({
            success: false,
            message: "Published challenge not found",
        });
        }

        if (challenge.language !== language) {
        return res.status(400).json({
            success: false,
            message: "Language does not match the challenge language",
        });
        }

        if (!challenge.testCases || challenge.testCases.length === 0) {
        return res.status(400).json({
            success: false,
            message: "This challenge has no test cases configured",
        });
        }

        // Save the submission before evaluation.
        const submission = await Submission.create({
        student: studentId,
        challenge: challengeId,
        code,
        language,
        status: "pending",
        });

        try {
        const evaluation = await evaluateCode({
            code,
            language,
            testCases: challenge.testCases,
        });

        submission.status = evaluation.status;
        submission.passedTestCases = evaluation.passedTestCases;
        submission.totalTestCases = evaluation.totalTestCases;

        let pointsAwarded = 0;

        if (evaluation.status === "accepted") {
            // Award points only once per student for this challenge.
            // itha apprama delete pannikkanum. 
            // const existingProgress = await Progress.findOne({
            // student: studentId,
            // course: challenge.course,
            // });

            // Challenge doesn't directly store course; resolve it through lesson/module.
            const Lesson = require("../models/Lesson");
            const Module = require("../models/Module");

            const lesson = await Lesson.findById(challenge.lesson).select("module");
            const moduleDoc = lesson
            ? await Module.findById(lesson.module).select("course")
            : null;

            if (!moduleDoc) {
            throw new Error("Challenge course could not be found");
            }

            let progress = await Progress.findOne({
            student: studentId,
            course: moduleDoc.course,
            });

            if (!progress) {
            progress = await Progress.create({
                student: studentId,
                course: moduleDoc.course,
            });
            }

            const alreadyCompleted = progress.completedChallenges.some(
            (id) => id.toString() === challenge._id.toString()
            );

            if (!alreadyCompleted) {
            progress.completedChallenges.push(challenge._id);
            progress.totalPoints += challenge.points;
            pointsAwarded = challenge.points;

            await progress.save();
            }
        }

        submission.pointsAwarded = pointsAwarded;
        await submission.save();

        // Do not expose hidden test-case inputs or expected outputs.
        const safeResults = evaluation.results.map((result, index) => {
            const testCase = challenge.testCases[index];

            return testCase.isHidden
            ? { passed: result.passed, hidden: true }
            : result;
        });

        return res.status(201).json({
            success: true,
            message: "Code evaluation completed",
            submission: {
            id: submission._id,
            status: submission.status,
            passedTestCases: submission.passedTestCases,
            totalTestCases: submission.totalTestCases,
            pointsAwarded: submission.pointsAwarded,
            },
            results: safeResults,
        });
        } catch (evaluationError) {
        submission.status = "error";
        await submission.save();
        throw evaluationError;
        }
    } catch (error) {
        next(error);
    }
    };


// GET LOGGED-IN STUDENT'S SUBMISSIONS
const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({
      student: req.user.id,
    })
      .populate("challenge", "title difficulty points")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

// GET ONE SUBMISSION BELONGING TO THE STUDENT
const getMySubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const submission = await Submission.findOne({
      _id: id,
      student: req.user.id,
    }).populate("challenge", "title difficulty points");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  getMySubmissions,
  getMySubmissionById,
};
