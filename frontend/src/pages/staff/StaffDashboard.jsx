import { getAuthUser } from "../../services/authService";

function StaffDashboard() {
  const user = getAuthUser();

  return (
    <div className="dashboard-content">
      <h1>Welcome, {user?.name} 👋</h1>
      <p>
        {user?.role === "support"
          ? "Support Dashboard"
          : "Sales Dashboard"}
      </p>
    </div>
  );
}

export default StaffDashboard;