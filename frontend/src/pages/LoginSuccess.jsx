
import { Link, useNavigate } from "react-router-dom";
import { getAuthUser, logoutUser } from "../services/authService";

function LoginSuccess() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <main className="auth-form-section">
      <div className="auth-form-container">
        <div className="form-heading">
          <span className="eyebrow">AUTHENTICATION SUCCESSFUL</span>
          <h2>You're signed in! 🎉</h2>

          <p>
            Welcome{user?.name ? `, ${user.name}` : ""}.
          </p>

          <p>
            Role: <strong>{user?.role || "Unknown"}</strong>
          </p>

          <p>
            Your dashboard will be available after we implement
            role-based access control.
          </p>
        </div>

        <button
          className="auth-button"
          type="button"
          onClick={handleLogout}
        >
          Sign out <span>→</span>
        </button>

        <p className="auth-switch">
          <Link to="/register">Back to registration</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginSuccess;
