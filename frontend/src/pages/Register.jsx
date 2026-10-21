
import { useState } from "react";
import { Link } from "react-router-dom";
import { registerStudent, verifyStudentOtp } from "../services/authService";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    profileType: "student",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (formData.password.length < 8 || formData.password.length > 72) {
      setError("Password must contain 8 to 72 characters.");
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerStudent(formData);

      setOtpSent(true);
      setMessage(
        result.message ||
          "Registration started. Check your mobile for the OTP."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyStudentOtp({
        mobile: formData.mobile.trim(),
        otp: otp.trim(),
    });

      setMessage(result.message || "Account verified successfully!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <div className="brand-icon">A</div>
          <span>AuraLearn <strong>AI</strong></span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">YOUR FUTURE STARTS HERE</span>
          <h1>
            Learn skills.
            <br />
            <span>Build your future.</span>
          </h1>
          <p>
            Learn at your own pace, practice coding, and turn your
            progress into achievements.
          </p>

          <div className="feature-list">
            <div><span>✓</span> Learn from structured courses</div>
            <div><span>✓</span> Practice real coding challenges</div>
            <div><span>✓</span> Track your learning progress</div>
          </div>
        </div>

        <div className="visual-footer">
          Learn something new every day ✨
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">A</div>
            <span>AuraLearn <strong>AI</strong></span>
          </div>

          {!otpSent ? (
            <>
              <div className="form-heading">
                <span className="eyebrow">CREATE YOUR ACCOUNT</span>
                <h2>Start learning today</h2>
                <p>Join AuraLearn AI and begin your journey.</p>
              </div>

              <form onSubmit={handleRegister} className="auth-form">
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="mobile">Mobile number</label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="Include country code, e.g. +919876543210"
                    value={formData.mobile}
                    onChange={handleChange}
                    autoComplete="tel"
                    pattern="^\+[1-9]\d{7,14}$"
                    title="Enter a number with country code, such as +919876543210"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="profileType">Your current status</label>
                  <select
                    id="profileType"
                    name="profileType"
                    value={formData.profileType}
                    onChange={handleChange}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="fresher">Fresher</option>
                    <option value="working">Working professional</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && <div className="alert error">{error}</div>}
                {message && <div className="alert success">{message}</div>}

                <button
                  className="auth-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Create account"}
                  {!loading && <span>→</span>}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <div className="form-heading">
                <span className="eyebrow">ONE LAST STEP</span>
                <h2>Verify your account</h2>
                <p>
                  Enter the OTP sent to your registered mobile number.
                  Follow your backend's configured OTP delivery method.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="field">
                  <label htmlFor="otp">6-digit OTP</label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    required
                  />
                </div>

                {error && <div className="alert error">{error}</div>}
                {message && <div className="alert success">{message}</div>}

                <button
                  className="auth-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                  {!loading && <span>→</span>}
                </button>

                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                >
                  Back to registration
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Register;
