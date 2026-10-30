
import courseApi from "./courseService";

// Get all lessons belonging to a module
export const getLessonsByModule = async (moduleId) => {
  const response = await courseApi.get(
    `/admin/modules/${moduleId}/lessons`
  );

  return response.data;
};

// Create a new lesson
export const createLesson = async (lessonData) => {
  const response = await courseApi.post(
    "/admin/lessons",
    lessonData
  );

  return response.data;
};

// Get a single lesson
export const getLessonById = async (lessonId) => {
  const response = await courseApi.get(
    `/admin/lessons/${lessonId}`
  );

  return response.data;
};

// Update an existing lesson
export const updateLesson = async (lessonId, lessonData) => {
  const response = await courseApi.put(
    `/admin/lessons/${lessonId}`,
    lessonData
  );

  return response.data;
};

// Delete a lesson
export const deleteLesson = async (lessonId) => {
  const response = await courseApi.delete(
    `/admin/lessons/${lessonId}`
  );

  return response.data;
};
