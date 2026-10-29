
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const courseApi = axios.create({
  baseURL: API_URL,
});

courseApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getAdminCourses = async () => {
  const response = await courseApi.get("/admin/courses");
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await courseApi.post("/admin/courses", courseData);
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await courseApi.put(
    `/admin/courses/${courseId}`,
    courseData
  );

  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await courseApi.delete(`/admin/courses/${courseId}`);
  return response.data;
};

export const uploadCourseImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await courseApi.post("/upload/image", formData);

  return response.data;
};


export default courseApi;
