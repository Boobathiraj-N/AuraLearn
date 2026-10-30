
import courseApi from "./courseService";

// Get all modules belonging to a course
export const getModulesByCourse = async (courseId) => {
  const response = await courseApi.get(
    `/admin/courses/${courseId}/modules`
  );

  return response.data;
};

// Create a new module
export const createModule = async (moduleData) => {
  const response = await courseApi.post(
    "/admin/modules",
    moduleData
  );

  return response.data;
};

// Update an existing module
export const updateModule = async (moduleId, moduleData) => {
  const response = await courseApi.put(
    `/admin/modules/${moduleId}`,
    moduleData
  );

  return response.data;
};

// Delete a module
export const deleteModule = async (moduleId) => {
  const response = await courseApi.delete(
    `/admin/modules/${moduleId}`
  );

  return response.data;
};

