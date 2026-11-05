
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  BookOpen,
  PlayCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GraduationCap,
  X,
} from "lucide-react";

import {
  getPublicCourseDetails,
  enrollFreeCourse,
} from "../../services/courseService";

import { startRazorpayPayment } from "../../utils/razorpayPayment";

const CourseIntroduction = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModule, setOpenModule] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicCourseDetails(courseId);
        setCourseData(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load course details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const course = courseData?.course;
  const modules = courseData?.modules || [];

  const totalPreviewLessons = modules.reduce(
    (total, module) =>
      total +
      (module.lessons || []).filter(
        (lesson) => lesson.isFreePreview
      ).length,
    0
  );

  const formatDuration = (minutes = 0) => {
    if (minutes < 60) return `${minutes} mins`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours}h ${remainingMinutes}m`
      : `${hours} hours`;
  };

  const handleEnrollment = async () => {
    try {
      setEnrolling(true);

      if (course.price === 0) {
        const result = await enrollFreeCourse(course._id);

        alert(result.message || "Successfully enrolled!");

        navigate("/student/my-courses");
      } else {
        await startRazorpayPayment(course._id);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-gray-300">
        Loading course details...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#09090b] text-white">
        <p className="text-red-400">
          {error || "Course not found"}
        </p>

        <button
          onClick={() => navigate("/student")}
          className="rounded-lg bg-violet-600 px-5 py-2"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-5 py-4 md:px-10">
        <button
          onClick={() => navigate("/student")}
          className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Courses
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        {/* Course Information */}
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <section>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-400">
                {course.category}
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              {course.title}
            </h1>

            <p className="mt-5 max-w-3xl leading-7 text-gray-400">
              {course.introduction || course.description}
            </p>

            {/* Course Statistics */}
            <div className="mt-7 flex flex-wrap gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Clock3 size={18} className="text-violet-400" />
                {formatDuration(course.durationMinutes)}
              </div>

              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-violet-400" />
                {courseData.totalModules} Modules
              </div>

              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-violet-400" />
                {courseData.totalLessons} Lessons
              </div>
            </div>
          </section>

          {/* Enrollment Card */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-white/10 bg-[#18181b]">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-52 w-full object-cover"
              />
            )}

            <div className="p-6">
              <p className="text-sm text-gray-400">
                Course Price
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                {course.price === 0
                  ? "Free"
                  : `₹${course.price}`}
              </h2>

              <button
                onClick={handleEnrollment}
                disabled={enrolling}
                className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enrolling
                  ? "Please wait..."
                  : course.price === 0
                    ? "Enroll Now"
                    : "Buy Now"}
              </button>

              <button
                onClick={() => {
                  const firstPreview = modules
                    .flatMap((module) => module.lessons || [])
                    .find((lesson) => lesson.isFreePreview);

                  if (firstPreview) {
                    setSelectedLesson(firstPreview);
                  } else {
                    alert("No free preview available for this course.");
                  }
                }}
                disabled={totalPreviewLessons === 0}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-3 font-medium text-gray-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlayCircle size={18} />
                Click to Preview
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                {totalPreviewLessons > 0
                  ? `${totalPreviewLessons} free preview lessons available`
                  : "No free preview available"}
              </p>
            </div>
          </aside>
        </div>

        {/* Course Curriculum */}
        <section className="mt-14">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Course Curriculum
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Explore the modules and lessons included in this course.
            </p>
          </div>

          <div className="max-w-4xl space-y-3">
            {modules.map((module, index) => {
              const isOpen = openModule === index;
              const lessons = module.lessons || [];

              return (
                <div
                  key={module._id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#18181b]"
                >
                  <button
                    onClick={() =>
                      setOpenModule(isOpen ? -1 : index)
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <div>
                      <p className="text-xs text-violet-400">
                        MODULE {index + 1}
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {module.title}
                      </h3>

                      <p className="mt-2 text-xs text-gray-500">
                        {lessons.length} Lessons
                      </p>
                    </div>

                    {isOpen ? (
                      <ChevronUp className="shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="shrink-0 text-gray-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10">
                      {lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4 last:border-b-0"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {lesson.isFreePreview ? (
                              <PlayCircle
                                size={18}
                                className="shrink-0 text-violet-400"
                              />
                            ) : (
                              <Lock
                                size={17}
                                className="shrink-0 text-gray-500"
                              />
                            )}

                            <div className="min-w-0">
                              <p className="text-sm text-gray-200">
                                {lessonIndex + 1}. {lesson.title}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {formatDuration(
                                  lesson.durationMinutes
                                )}
                              </p>
                            </div>
                          </div>

                          {lesson.isFreePreview ? (
                            <button
                              onClick={() =>
                                setSelectedLesson(lesson)
                              }
                              className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <CheckCircle2 size={13} />
                              FREE PREVIEW
                            </button>
                          ) : (
                            <span className="shrink-0 text-xs text-gray-500">
                              <Lock size={15} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Preview Video Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#18181b]">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xs text-violet-400">
                  FREE PREVIEW
                </p>

                <h3 className="mt-1 font-semibold">
                  {selectedLesson.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Close preview"
              >
                <X size={22} />
              </button>
            </div>

            <div className="aspect-video bg-black">
              <iframe
                key={selectedLesson._id}
                src={selectedLesson.videoUrl}
                title={selectedLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseIntroduction;
