import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const feedbackApi = axios.create({
  baseURL: `${API_URL}/course-feedback`,
});

feedbackApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Get courses waiting for feedback
export const getPendingCourseFeedback = async () => {
  const response = await feedbackApi.get("/pending");
  return response.data;
};

// Submit course feedback
export const submitCourseFeedback = async (courseId, data) => {
  const response = await feedbackApi.post(`/${courseId}`, data);
  return response.data;
};