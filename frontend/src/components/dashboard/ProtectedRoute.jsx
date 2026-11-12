
import { Navigate, Outlet } from "react-router-dom";
import { getAuthUser } from "../../services/authService";

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("authToken");
  const user = getAuthUser();

  // Check authentication
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization only when roles are specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
