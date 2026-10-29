
const {
  submitCode,
  getSubmissionResult,
} = require("./judge0.service");

const LANGUAGE_IDS = require("../config/language.config");

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const normalizeOutput = (output = "") =>
  String(output).trim().replace(/\r\n/g, "\n");

const evaluateCode = async ({ code, language, testCases }) => {
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error("Unsupported programming language");
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error("No test cases available for this challenge");
  }

  const results = [];

  for (const testCase of testCases) {
    const submission = await submitCode({
      sourceCode: code,
      languageId,
      stdin: testCase.input || "",
    });

    if (!submission.token) {
      throw new Error("Judge0 did not return a submission token");
    }

    let result;

    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(1000);

      result = await getSubmissionResult(submission.token);

      // 1 = In Queue, 2 = Processing
      if (result.status && result.status.id > 2) {
        break;
      }
    }

    if (!result || !result.status || result.status.id <= 2) {
      throw new Error("Judge0 execution timed out");
    }

    const accepted =
      result.status.id === 3 &&
      normalizeOutput(result.stdout) ===
        normalizeOutput(testCase.expectedOutput);

    results.push({
      passed: accepted,
      ...(testCase.isHidden
        ? {}
        : {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.stdout ?? "",
          }),
    });
  }

  const passedTestCases = results.filter(
    (result) => result.passed
  ).length;

  return {
    status:
      passedTestCases === testCases.length
        ? "accepted"
        : "rejected",
    passedTestCases,
    totalTestCases: testCases.length,
    results,
  };
};

module.exports = { evaluateCode };
