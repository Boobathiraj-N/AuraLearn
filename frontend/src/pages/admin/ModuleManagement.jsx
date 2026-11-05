import { useEffect, useState } from "react";
import { Plus, Search, BookOpen, LoaderCircle } from "lucide-react";
import { getAdminCourses } from "../../services/courseService";
import {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
} from "../../services/moduleService";

const initialForm = {
  course: "",
  title: "",
  description: "",
  order: 1,
  status: "draft",
};

const ModuleManagement = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingModule, setEditingModule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingModuleId, setUpdatingModuleId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getAdminCourses();
      const courseList = Array.isArray(data)
        ? data
        : data.courses || [];

      setCourses(courseList);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load courses.");
    }
  };

  const loadModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getModulesByCourse(courseId);
      setModules(Array.isArray(data) ? data : data.modules || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load modules.");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (event) => {
    const courseId = event.target.value;
    setSelectedCourse(courseId);
    loadModules(courseId);
  };

  const openCreateForm = () => {
    setEditingModule(null);
    setForm({
      ...initialForm,
      course: selectedCourse,
      order: modules.length + 1,
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (module) => {
    setEditingModule(module);
    setForm({
      course: module.course,
      title: module.title || "",
      description: module.description || "",
      order: module.order ?? 1,
      status: module.status || "draft",
    });
    setError("");
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingModule) {
        await updateModule(editingModule._id, form);
      } else {
        await createModule(form);
      }

      setShowForm(false);
      setEditingModule(null);
      await loadModules(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save module.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (module) => {
    const confirmed = window.confirm(
      `Delete "${module.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteModule(module._id);
      await loadModules(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete module.");
    }
  };

  const handleToggleStatus = async (module) => {
    const nextStatus =
      module.status === "published" ? "draft" : "published";

    try {
      setUpdatingModuleId(module._id);
      setError("");

      await updateModule(module._id, {
        status: nextStatus,
      });

      await loadModules(selectedCourse);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update module status"
      );
    } finally {
      setUpdatingModuleId(null);
    }
  };

  const filteredModules = modules.filter((module) =>
    module.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Module Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Organize course content into modules.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
        <select
          value={selectedCourse}
          onChange={handleCourseChange}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 sm:max-w-md"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>

        <button
          onClick={openCreateForm}
          disabled={!selectedCourse}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Add Module
        </button>
      </div>

      {selectedCourse && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-900">
              Course Modules ({filteredModules.length})
            </h2>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="rounded-xl border border-slate-200 py-2 pl-9 pr-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="animate-spin text-indigo-600" />
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto text-slate-400" size={36} />
              <p className="mt-3 font-medium text-slate-700">
                No modules found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add your first module to this course.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredModules.map((module) => (
                <div
                  key={module._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {module.order}. {module.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {module.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        module.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {module.status === "published"
                        ? "Published"
                        : "Draft"}
                    </span>

                    <button
                      onClick={() => openEditForm(module)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-indigo-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(module)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {editingModule ? "Edit Module" : "Create Module"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Module Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="e.g. JavaScript Fundamentals"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Describe this module..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Module Order *
                </label>
                <input
                  type="number"
                  name="order"
                  min="1"
                  value={form.order}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Module Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingModule
                      ? "Update Module"
                      : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
};

export default ModuleManagement;