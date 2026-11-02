
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("authToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Get logged-in staff's assigned leads
export const getMyLeads = async () => {
  const response = await axios.get(
    `${API_URL}/leads/my-leads`,
    getAuthConfig()
  );

  return response.data;
};

// Add a note to a lead
export const addLeadNote = async (leadId, content) => {
  const response = await axios.post(
    `${API_URL}/leads/${leadId}/notes`,
    { content },
    getAuthConfig()
  );

  return response.data;
};

// Get notes of a lead
export const getLeadNotes = async (leadId) => {
  const response = await axios.get(
    `${API_URL}/leads/${leadId}/notes`,
    getAuthConfig()
  );

  return response.data;
};

// Update lead status and temperature
export const updateLead = async (leadId, data) => {
  const response = await axios.patch(
    `${API_URL}/leads/${leadId}`,
    data,
    getAuthConfig()
  );

  return response.data;
};
