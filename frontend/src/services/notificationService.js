
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const notificationApi = axios.create({
  baseURL: API_URL,
});

notificationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// GET ALL NOTIFICATIONS
export const getMyNotifications = async (page = 1, limit = 20) => {
  const response = await notificationApi.get("/notifications", {
    params: { page, limit },
  });

  return response.data;
};

// GET UNREAD NOTIFICATION COUNT
export const getUnreadCount = async () => {
  const response = await notificationApi.get(
    "/notifications/unread-count"
  );

  return response.data;
};

// MARK SINGLE NOTIFICATION AS READ
export const markNotificationAsRead = async (notificationId) => {
  const response = await notificationApi.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = async () => {
  const response = await notificationApi.patch(
    "/notifications/read-all"
  );

  return response.data;
};

export const markGroupNotificationsAsRead = async (groupId) => {
  const response = await notificationApi.patch(
    `/notifications/groups/${groupId}/read`
  );

  return response.data;
};

export default notificationApi;
