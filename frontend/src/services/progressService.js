import authAPI from "./authService";

// Get student's course progress
export const getCourseProgress = async (courseId) => {
  const response = await authAPI.get(
    `/progress/courses/${courseId}`
  );

  return response.data;
};

// Mark lesson as completed
export const completeLesson = async (courseId, lessonId) => {
  const response = await authAPI.patch(
    `/progress/courses/${courseId}/lessons/${lessonId}/complete`
  );

  return response.data;
};
