

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!result.token || !result.user) {
        setError("Login response is incomplete. Please try again.");
        return;
      }

      // Temporary login storage for this development stage.
      localStorage.setItem("authToken", result.token);
      localStorage.setItem("authUser", JSON.stringify(result.user));

      // Dashboard routing will be added with RBAC later.
      navigate("/login-success", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to log in. Please try again."
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
          <span className="eyebrow">WELCOME TO YOUR LEARNING SPACE</span>
          <h1>
            Your next
            <br />
            <span>chapter starts here.</span>
          </h1>
          <p>
            Continue learning, sharpen your coding skills,
            and keep moving toward your goals.
          </p>

          <div className="feature-list">
            <div><span>✓</span> Continue your learning journey</div>
            <div><span>✓</span> Practice coding challenges</div>
            <div><span>✓</span> Celebrate your progress</div>
          </div>
        </div>

        <div className="visual-footer">
          Every expert was once a beginner ✨
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">A</div>
            <span>AuraLearn <strong>AI</strong></span>
          </div>

          <div className="form-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue learning.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;

