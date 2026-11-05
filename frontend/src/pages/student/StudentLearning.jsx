
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getEnrolledCourseContent } from "../../services/courseService";
import { getCourseProgress } from "../../services/progressService";

const StudentLearning = () => {
  const { courseId } = useParams();

  const [courseData, setCourseData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState([]);

  useEffect(() => {
    const fetchLearningData = async () => {
      try {
        setLoading(true);
        setError("");

        const [contentResponse, progressResponse] =
          await Promise.all([
            getEnrolledCourseContent(courseId),
            getCourseProgress(courseId),
          ]);

        setCourseData(contentResponse);
        setProgress(progressResponse.progress);

        const firstModule = contentResponse.modules?.[0];
        const firstLesson = firstModule?.lessons?.[0];

        setSelectedLesson(firstLesson || null);

        if (firstModule) {
          setExpandedModules([firstModule._id]);
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load course content"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [courseId]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const allLessons = useMemo(
    () =>
      courseData?.modules?.flatMap((module) =>
        (module.lessons || []).map((lesson) => ({
          ...lesson,
          moduleId: module._id,
          moduleTitle: module.title,
        }))
      ) || [],
    [courseData]
  );

  const selectedLessonIndex = allLessons.findIndex(
    (lesson) => lesson._id === selectedLesson?._id
  );

  const completedLessons = progress?.completedLessons || [];

  const isLessonCompleted = (lessonId) =>
    completedLessons.some(
      (item) => item === lessonId || item?._id === lessonId
    );

  const completedCount = allLessons.filter((lesson) =>
    isLessonCompleted(lesson._id)
  ).length;

  const progressPercentage =
    progress?.progressPercentage || 0;

  const selectLesson = (lesson, moduleId) => {
    setSelectedLesson(lesson);

    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId]
    );
  };

  const goToPreviousLesson = () => {
    if (selectedLessonIndex > 0) {
      const previousLesson = allLessons[selectedLessonIndex - 1];

      selectLesson(previousLesson, previousLesson.moduleId);
    }
  };

  const goToNextLesson = () => {
    if (selectedLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[selectedLessonIndex + 1];

      selectLesson(nextLesson, nextLesson.moduleId);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d18]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">
            Loading your classroom...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d18] px-6">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#111827] p-8 text-center">
          <p className="text-lg font-semibold text-red-400">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!courseData?.modules?.length || !allLessons.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d18] text-gray-400">
        No published lessons available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d18] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1322]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              AuraLearn Classroom
            </p>

            <h1 className="mt-1 truncate text-lg font-bold sm:text-xl">
              {courseData.course?.title || "My Learning"}
            </h1>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-xs text-gray-400">Course progress</p>
            <p className="mt-1 text-lg font-bold text-indigo-400">
              {progressPercentage}%
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

          {/* LEFT: Video and Lesson Details */}
          <section className="min-w-0">
            {/* Video Player */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-xs font-medium text-indigo-400">
                    NOW LEARNING
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    {selectedLesson?.moduleTitle || "Course lesson"}
                  </p>
                </div>

                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  Lesson {selectedLessonIndex + 1} / {allLessons.length}
                </span>
              </div>

              <div className="bg-black">
                {selectedLesson?.videoUrl &&
                !selectedLesson.videoUrl.includes("VIDEO_ID") ? (
                  <iframe
                    key={selectedLesson._id}
                    className="aspect-video w-full"
                    src={selectedLesson.videoUrl}
                    title={selectedLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center bg-[#080c16] px-4 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-3xl">
                      ▶
                    </div>
                    <p className="font-medium text-gray-300">
                      Video not available
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      The instructor has not added a video for this lesson yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson Information */}
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300">
                    {selectedLesson?.moduleTitle}
                  </span>

                  {selectedLesson &&
                    isLessonCompleted(selectedLesson._id) && (
                      <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        ✓ Completed
                      </span>
                    )}
                </div>

                <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
                  {selectedLesson?.title || "Select a lesson"}
                </h2>

                {selectedLesson?.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
                    {selectedLesson.description}
                  </p>
                )}

                <div className="my-6 border-t border-white/10" />

                {/* Previous and Next */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={goToPreviousLesson}
                    disabled={selectedLessonIndex <= 0}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-indigo-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ← Previous Lesson
                  </button>

                  <button
                    onClick={goToNextLesson}
                    disabled={
                      selectedLessonIndex === allLessons.length - 1
                    }
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next Lesson →
                  </button>
                </div>
              </div>
            </div>

            {/* Overall Progress Card */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Your learning journey</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Keep learning and complete your course.
                  </p>
                </div>

                <span className="text-2xl font-bold text-indigo-400">
                  {progressPercentage}%
                </span>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(progressPercentage, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>{completedCount} lessons completed</span>
                <span>{allLessons.length} total lessons</span>
              </div>
            </div>
          </section>

          {/* RIGHT: Course Content Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] xl:sticky xl:top-24">
            {/* Sidebar Header */}
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Course content
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    Lessons & Modules
                  </h2>
                </div>

                <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-300">
                  {allLessons.length} lessons
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Your progress</span>
                  <span className="font-semibold text-indigo-300">
                    {progressPercentage}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min(progressPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="max-h-[650px] divide-y divide-white/5 overflow-y-auto">
              {courseData.modules.map((module, moduleIndex) => {
                const isExpanded = expandedModules.includes(module._id);

                const moduleCompletedCount = (module.lessons || []).filter(
                  (lesson) => isLessonCompleted(lesson._id)
                ).length;

                return (
                  <div key={module._id}>
                    <button
                      onClick={() => toggleModule(module._id)}
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-300">
                        {moduleIndex + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-200">
                          {module.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {moduleCompletedCount}/{module.lessons?.length || 0} completed
                        </p>
                      </div>

                      <span className="text-lg text-gray-400">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 px-3 pb-3">
                        {module.lessons?.map((lesson, lessonIndex) => {
                          const isSelected =
                            selectedLesson?._id === lesson._id;

                          const completed = isLessonCompleted(lesson._id);

                          return (
                            <button
                              key={lesson._id}
                              onClick={() =>
                                selectLesson(lesson, module._id)
                              }
                              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                isSelected
                                  ? "border border-indigo-500/30 bg-indigo-500/10"
                                  : "border border-transparent hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${
                                  completed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : isSelected
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white/5 text-gray-400"
                                }`}
                              >
                                {completed ? "✓" : lessonIndex + 1}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-sm ${
                                    isSelected
                                      ? "font-semibold text-indigo-300"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {lesson.title}
                                </span>

                                <span className="mt-1 block text-xs text-gray-500">
                                  {completed
                                    ? "Completed"
                                    : "Lesson"}
                                </span>
                              </span>

                              {isSelected && (
                                <span className="text-xs text-indigo-400">
                                  Playing
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Keep it up!
                  </p>
                  <p className="text-xs text-gray-500">
                    Every lesson brings you closer to your goal.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentLearning;
