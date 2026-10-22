
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authAPI from "../../services/authService";

function SetStaffPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Activation token is missing from the link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await authAPI.post("/auth/activate-staff", {
        token,
        password,
      });

      setSuccess("Account activated successfully! You can now log in.");

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Activation failed. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-form-section">
        <div className="auth-form-container">
          <Link to="/login" className="brand">
            <span className="brand-icon">A</span>
            <span>AuraLearn AI</span>
          </Link>

          <div className="form-heading">
            <h1>Set your password</h1>
            <p>Create a password to activate your staff account.</p>
          </div>

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          {success ? (
            <div>
              <p>{success}</p>
              <button
                type="button"
                className="auth-button"
                onClick={() => navigate("/login")}
              >
                Go to login
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                  placeholder="Enter at least 8 characters"
                />
              </label>

              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                />
              </label>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? "Activating..." : "Set password & activate"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default SetStaffPassword;
