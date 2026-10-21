const crypto = require("crypto");

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (mobile, otp) => {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET is missing");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${mobile}:${otp}`)
    .digest("hex");
};

const sendOtp = async (mobile, otp) => {
  const provider = process.env.OTP_PROVIDER;
  const isProduction = process.env.NODE_ENV === "production";

  if (provider === "mock" && !isProduction) {
    console.log(`[DEV ONLY] OTP for ${mobile}: ${otp}`);

    return { developmentOtp: otp };
  }

  // A real SMS provider must be integrated here.
  throw new Error("SMS OTP provider is not configured");
};

module.exports = { generateOtp, hashOtp, sendOtp };