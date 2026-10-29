
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import LoginSuccess from "./pages/LoginSuccess";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./App.css";
import StaffManagement from "./pages/admin/StaffManagement";
import SetStaffPassword from "./pages/portal/SetStaffPassword";
import CourseManagement from "./pages/admin/CourseManagement";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
         <Route
          path="/portal/set-password"
          element={<SetStaffPassword />}
        />
        <Route path="/login-success" element={<LoginSuccess />} />

        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route
            path="settings"
            element={<h1>Settings — Coming later</h1>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;
