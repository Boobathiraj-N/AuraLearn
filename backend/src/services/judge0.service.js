
const axios = require("axios");

const JUDGE0_API_URL = process.env.JUDGE0_API_URL;
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const judge0Client = axios.create({
  baseURL: JUDGE0_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    ...(JUDGE0_API_KEY
      ? { "X-Auth-Token": JUDGE0_API_KEY }
      : {}),
  },
});

// Submit code to Judge0
const submitCode = async ({
  sourceCode,
  languageId,
  stdin = "",
}) => {
  const response = await judge0Client.post(
    "/submissions?base64_encoded=false&wait=false",
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }
  );

  return response.data;
};

// Get execution result using the submission token
const getSubmissionResult = async (token) => {
  const response = await judge0Client.get(
    `/submissions/${encodeURIComponent(token)}?base64_encoded=false`
  );

  return response.data;
};

module.exports = {
  submitCode,
  getSubmissionResult,
};
