
require("dotenv").config();

const { evaluateCode } = require("../src/services/codeEvaluation.service");

const testEvaluation = async () => {
  try {
    const result = await evaluateCode({
      code: "function add(a, b) { return a + b; }\nconsole.log(add(2, 3));",
      language: "javascript",
      testCases: [
        {
          input: "",
          expectedOutput: "5",
          isHidden: false,
        },
        {
          input: "",
          expectedOutput: "10",
          isHidden: true,
        },
      ],
    });

    console.log("Evaluation result:");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Evaluation failed:", error.response?.data || error.message);
  }
};

testEvaluation();
