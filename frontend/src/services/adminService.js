import authAPI from "./authService";

// Get Admin Dashboard Statistics
export const getDashboardStats = async () => {
  const response = await authAPI.get("/admin/dashboard/stats");
  return response.data;
};