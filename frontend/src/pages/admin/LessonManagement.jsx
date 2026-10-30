import { useEffect, useState } from "react";
import {
  BookOpen,
  Layers,
  PlayCircle,
  Plus,
  ChevronDown,
  X,
} from "lucide-react";
import { getAdminCourses } from "../../services/courseService";
import { getModulesByCourse } from "../../services/moduleService";
import { getLessonsByModule, createLesson, } from "../../services/lessonService";

function LessonManagement() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [error, setError] = useState("");
    const [modules, setModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [savingLesson, setSavingLesson] = useState(false);

    const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    durationMinutes: 0,
    order: "",
    isFreePreview: false,
    status: "draft",
    });

    useEffect(() => {
    const fetchCourses = async () => {
        try {
        setLoadingCourses(true);
        setError("");

        const response = await getAdminCourses();

        setCourses(
            Array.isArray(response)
            ? response
            : response.courses || []
        );
        } catch (error) {
        console.error("Failed to load courses:", error);

        setError(
            error.response?.data?.message || "Failed to load courses"
        );
        } finally {
        setLoadingCourses(false);
        }
    };

    fetchCourses();
    }, []);

    useEffect(() => {
    if (!selectedCourse) {
        setModules([]);
        return;
    }

    const fetchModules = async () => {
        try {
        setLoadingModules(true);
        setError("");

        const response = await getModulesByCourse(selectedCourse);

        setModules(response.modules || []);
        } catch (error) {
        console.error("Failed to load modules:", error);
        setError(
            error.response?.data?.message || "Failed to load modules"
        );
        setModules([]);
        } finally {
        setLoadingModules(false);
        }
    };

    fetchModules();
    }, [selectedCourse]);

    useEffect(() => {
    if (!selectedModule) {
        setLessons([]);
        return;
    }

    const fetchLessons = async () => {
        try {
        setLoadingLessons(true);
        setError("");

        const response = await getLessonsByModule(selectedModule);

        setLessons(response.lessons || []);
        } catch (error) {
        console.error("Failed to load lessons:", error);

        setError(
            error.response?.data?.message || "Failed to load lessons"
        );

        setLessons([]);
        } finally {
        setLoadingLessons(false);
        }
    };

    fetchLessons();
    }, [selectedModule]);

    const handleLessonChange = (e) => {
    const { name, value, type, checked } = e.target;

    setLessonForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
    }));
    };

    const handleCreateLesson = async (e) => {
    e.preventDefault();

    try {
        setSavingLesson(true);
        setError("");

        await createLesson({
        ...lessonForm,
        module: selectedModule,
        order: Number(lessonForm.order),
        durationMinutes: Number(lessonForm.durationMinutes),
        });

        const response = await getLessonsByModule(selectedModule);
        setLessons(response.lessons || []);

        setLessonForm({
        title: "",
        description: "",
        videoUrl: "",
        durationMinutes: 0,
        order: "",
        isFreePreview: false,
        status: "draft",
        });

        setShowLessonModal(false);
    } catch (error) {
        setError(
        error.response?.data?.message || "Failed to create lesson"
        );
    } finally {
        setSavingLesson(false);
    }
    };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Lesson Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage courses, modules, and lessons in one place.
        </p>
      </div>

      {/* Course and Module Selection */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Course Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                Select Course
              </h2>
              <p className="text-xs text-slate-500">
                Choose a course to manage its modules
              </p>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedModule("");
              }}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">
                {loadingCourses ? "Loading courses..." : "Select a course"}
                </option>

                {courses.map((course) => (
                <option key={course._id} value={course._id}>
                    {course.title}
                </option>
                ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-3 text-slate-400"
            />
          </div>
        </div>

        {/* Module Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                Select Module
              </h2>
              <p className="text-xs text-slate-500">
                Choose a module to manage its lessons
              </p>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={!selectedCourse}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {loadingModules ? "Loading modules..." : "Select a module"}
                </option>

                {modules.map((module) => (
                <option key={module._id} value={module._id}>
                    {module.title}
                </option>
                ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-3 text-slate-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
        )}

      {/* Lessons Section */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <PlayCircle size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                Lessons
              </h2>
              <p className="text-xs text-slate-500">
                Manage lessons inside the selected module
              </p>
            </div>
          </div>

            <button
            disabled={!selectedModule}
            onClick={() => setShowLessonModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
            <Plus size={18} />
            Add Lesson
            </button>
        </div>

        <div className="p-5">
        {!selectedModule ? (
            <div className="py-12 text-center">
            <PlayCircle size={32} className="mx-auto mb-3 text-slate-400" />
            <h3 className="font-semibold text-slate-700">
                No lessons selected
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Select a course and module to view lessons.
            </p>
            </div>
        ) : loadingLessons ? (
            <p className="py-10 text-center text-sm text-slate-500">
            Loading lessons...
            </p>
        ) : lessons.length === 0 ? (
            <div className="py-12 text-center">
            <PlayCircle size={32} className="mx-auto mb-3 text-slate-400" />
            <h3 className="font-semibold text-slate-700">
                No lessons found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                This module doesn't have any lessons yet.
            </p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Lesson Title</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Status</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                {lessons.map((lesson) => (
                    <tr key={lesson._id}>
                    <td className="px-4 py-3">{lesson.order}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                        {lesson.title}
                    </td>
                    <td className="px-4 py-3">
                        {lesson.durationMinutes} min
                    </td>
                    <td className="px-4 py-3">
                        {lesson.isFreePreview ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                        {lesson.status}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
      </div>
        {showLessonModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-5">
                    <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        Create New Lesson
                    </h2>
                    <p className="text-sm text-slate-500">
                        Add a lesson to the selected module.
                    </p>
                    </div>

                    <button
                    onClick={() => setShowLessonModal(false)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                    <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleCreateLesson} className="space-y-4 p-5">
                    <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Lesson Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={lessonForm.title}
                        onChange={handleLessonChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                        placeholder="e.g. Introduction to React"
                    />
                    </div>

                    <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={lessonForm.description}
                        onChange={handleLessonChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                        placeholder="Enter lesson description"
                    />
                    </div>

                    <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Video URL
                    </label>
                    <input
                        type="url"
                        name="videoUrl"
                        value={lessonForm.videoUrl}
                        onChange={handleLessonChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                        placeholder="https://..."
                    />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                        Duration (minutes)
                        </label>
                        <input
                        type="number"
                        name="durationMinutes"
                        min="0"
                        value={lessonForm.durationMinutes}
                        onChange={handleLessonChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                        Lesson Order *
                        </label>
                        <input
                        type="number"
                        name="order"
                        min="1"
                        value={lessonForm.order}
                        onChange={handleLessonChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                        placeholder="e.g. 1"
                        />
                    </div>
                    </div>

                    <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <select
                        name="status"
                        value={lessonForm.status}
                        onChange={handleLessonChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        name="isFreePreview"
                        checked={lessonForm.isFreePreview}
                        onChange={handleLessonChange}
                        className="h-4 w-4 accent-indigo-600"
                    />
                    Allow free preview
                    </label>

                    <div className="flex justify-end gap-3 border-t pt-4">
                    <button
                        type="button"
                        onClick={() => setShowLessonModal(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={savingLesson}
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {savingLesson ? "Creating..." : "Create Lesson"}
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}

    </div>
  );
}

export default LessonManagement;
