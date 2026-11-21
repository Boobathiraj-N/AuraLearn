import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const groupApi = axios.create({
  baseURL: API_URL,
});

groupApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// GET STUDENT'S GROUPS
export const getMyGroups = async () => {
  const response = await groupApi.get("/groups/my-groups");
  return response.data;
};

// GET SUPPORT STAFF'S ASSIGNED GROUPS
export const getMySupportGroups = async () => {
  const response = await groupApi.get("/groups/my-support-groups");
  return response.data;
};

// GET GROUP MESSAGES
export const getGroupMessages = async (groupId, page = 1, limit = 20) => {
  const response = await groupApi.get(
    `/groups/${groupId}/messages`,
    {
      params: { page, limit },
    }
  );

  return response.data;
};

// SEND TEXT MESSAGE
export const sendGroupMessage = async (groupId, content) => {
  const response = await groupApi.post(
    `/groups/${groupId}/messages`,
    { content }
  );

  return response.data;
};

// SEND IMAGE MESSAGE
export const sendGroupImage = async (groupId, imageFile) => {
  const formData = new FormData();

  formData.append("image", imageFile);

  const response = await groupApi.post(
    `/groups/${groupId}/images`,
    formData
  );

  return response.data;
};

// ADMIN: GET ALL COURSE GROUPS
export const getAllGroups = async () => {
  const response = await groupApi.get("/groups/admin/all-groups");
  return response.data;
};

// ADMIN: GET ACTIVE SUPPORT STAFF
export const getActiveSupportStaff = async () => {
  const response = await groupApi.get("/groups/admin/support-staff");
  return response.data;
};

// ADMIN: ASSIGN SUPPORT TO GROUP
export const assignSupportToGroup = async (groupId, supportIds) => {
  const response = await groupApi.patch(
    `/groups/${groupId}/assign-support`,
    { supportIds }
  );

  return response.data;
};

export default groupApi;