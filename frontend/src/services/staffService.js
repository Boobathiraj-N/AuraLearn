
import authAPI from "./authService";

// Get all staff members
export const getAllStaff = async () => {
  const response = await authAPI.get("/admin/staff");
  return response.data;
};

// Create a new staff member
export const createStaff = async (staffData) => {
  const response = await authAPI.post("/admin/staff", staffData);
  return response.data;
};

// Get one staff member by ID
export const getStaffById = async (staffId) => {
  const response = await authAPI.get(`/admin/staff/${staffId}`);
  return response.data;
};

// Update staff details
export const updateStaff = async (staffId, staffData) => {
  const response = await authAPI.put(
    `/admin/staff/${staffId}`,
    staffData
  );
  return response.data;
};

// Activate or deactivate a staff account
export const updateStaffStatus = async (staffId, isActive) => {
  const response = await authAPI.patch(
    `/admin/staff/${staffId}/status`,
    { isActive }
  );

  return response.data;
};
