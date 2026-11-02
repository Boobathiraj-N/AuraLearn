
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import LoginSuccess from "./pages/LoginSuccess";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import SetStaffPassword from "./pages/portal/SetStaffPassword";
import CourseManagement from "./pages/admin/CourseManagement";
import LessonManagement from "./pages/admin/LessonManagement";
import ProtectedRoute from "./components/dashboard/ProtectedRoute";
import StaffDashboard from "./pages/staff/StaffDashboard";
import LeadManagement from "./pages/staff/LeadManagement";
import LeadDetails from "./pages/staff/LeadDetails";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal/set-password" element={<SetStaffPassword />} />
        <Route path="/login-success" element={<LoginSuccess />} />

        {/* Unauthorized Page */}
        <Route
          path="/unauthorized"
          element={<h1>403 - Access Denied</h1>}
        />

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="lessons" element={<LessonManagement />} />
            <Route
              path="settings"
              element={<h1>Settings — Coming later</h1>}
            />
          </Route>
        </Route>

        {/* Support Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={["support"]} />}>
          <Route path="/support" element={<DashboardLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route
              path="leads/:leadId"
              element={<LeadDetails />}
            />
          </Route>
        </Route>

        {/* Sales Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={["sales"]} />}>
          <Route path="/sales" element={<DashboardLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route
              path="leads/:leadId"
              element={<LeadDetails />}
            />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
