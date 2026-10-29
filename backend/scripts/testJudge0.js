
require("dotenv").config();

const {
  submitCode,
  getSubmissionResult,
} = require("../src/services/judge0.service");

const LANGUAGE_IDS = require("../src/config/language.config");

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const testJudge0 = async () => {
  try {
    console.log("Submitting JavaScript code to Judge0...");

    const submission = await submitCode({
      sourceCode: "console.log(1 + 1);",
      languageId: LANGUAGE_IDS.javascript,
      stdin: "",
    });

    console.log("Submission token:", submission.token);

    if (!submission.token) {
      throw new Error("Judge0 did not return a submission token.");
    }

    let result;

    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(1000);

      result = await getSubmissionResult(submission.token);

      // Status 1 = In Queue, Status 2 = Processing
      if (result.status && result.status.id > 2) {
        break;
      }
    }

    console.log("Execution status:", result.status?.description);
    console.log("Program output:", result.stdout ?? "No output");
    console.log("Compiler error:", result.compile_output ?? "None");
    console.log("Runtime error:", result.stderr ?? "None");
  } catch (error) {
    console.error(
      "Judge0 test failed:",
      error.response?.data || error.message
    );
  }
};

testJudge0();
