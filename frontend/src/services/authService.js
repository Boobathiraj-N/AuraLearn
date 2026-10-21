
import axios from "axios";

const authAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Read the current token
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Read the current user
export const getAuthUser = () => {
  try {
    const user = localStorage.getItem("authUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Clear the current session
export const logoutUser = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
};

// Automatically attach the token to API requests
authAPI.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid authentication tokens
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logoutUser();

      const currentPath = window.location.pathname;

      if (
        currentPath !== "/login" &&
        currentPath !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const registerStudent = async (formData) => {
  const response = await authAPI.post("/auth/register", formData);
  return response.data;
};

export const verifyStudentOtp = async (data) => {
  const response = await authAPI.post("/auth/verify-otp", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await authAPI.post("/auth/login", data);
  return response.data;
};

export default authAPI;

