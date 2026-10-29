
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
} from "lucide-react";
import {
  getAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseImage,
} from "../../services/courseService";

const initialForm = {
  title: "",
  description: "",
  introduction: "",
  category: "Web Development",
  level: "Beginner",
  price: 0,
  thumbnail: "",
  durationMinutes: 60,
  status: "draft",
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
const [uploadingImage, setUploadingImage] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminCourses();
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load courses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "price" || name === "durationMinutes"
          ? Number(value)
          : value,
    }));
  };

  const handleImageChange = async (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  // Image file validation
  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    event.target.value = "";
    return;
  }

  // Maximum file size: 5 MB
  if (file.size > 5 * 1024 * 1024) {
    setError("Image size must be less than 5 MB.");
    event.target.value = "";
    return;
  }

  setSelectedImage(URL.createObjectURL(file));
  setUploadingImage(true);
  setError("");

  try {
    const result = await uploadCourseImage(file);

    setForm((previous) => ({
      ...previous,
      thumbnail: result.imageUrl,
    }));
  } catch (err) {
    setError(
      err.response?.data?.message || "Image upload failed."
    );
    setSelectedImage(null);
  } finally {
    setUploadingImage(false);
    event.target.value = "";
  }
};

  const openCreateForm = () => {
    setEditingCourse(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (course) => {
    setEditingCourse(course);
    setForm({
      ...initialForm,
      ...course,
      category: course.category || "Web Development",
      level: course.level || "Beginner",
      price: course.price ?? 0,
      durationMinutes: course.durationMinutes ?? 60,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingCourse) {
        await updateCourse(editingCourse._id, form);
      } else {
        await createCourse(form);
      }

      setShowForm(false);
      setEditingCourse(null);
      setForm(initialForm);
      await loadCourses();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save the course."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteCourse(course._id);
      await loadCourses();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete the course."
      );
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusClasses = {
    draft: "bg-amber-100 text-amber-700",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage your learning courses.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Course
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses by title..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto text-slate-400" size={40} />
          <h2 className="mt-4 font-semibold text-slate-800">
            No courses found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first course or try another search.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Course</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Level</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-600">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {course.title}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-slate-500">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {course.category}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {course.level}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {Number(course.price) === 0
                      ? "Free"
                      : `₹${course.price}`}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[course.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(course)}
                        title="Edit course"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        title="Delete course"
                        className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 py-8">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCourse ? "Edit Course" : "Create Course"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the course information below.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Course Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                  placeholder="e.g. React Fundamentals"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                  placeholder="What will students learn?"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Introduction
                </label>
                <textarea
                  name="introduction"
                  value={form.introduction}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3"
                  >
                    <option>Web Development</option>
                    <option>Programming</option>
                    <option>Data Science</option>
                    <option>AI & Machine Learning</option>
                    <option>Database</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Level
                  </label>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    min="1"
                    value={form.durationMinutes}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Course Thumbnail
                </label>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-medium file:text-indigo-700"
                />

                <p className="mt-2 text-xs text-slate-500">
                    JPG, PNG or WebP. Maximum file size: 5 MB.
                </p>

                {uploadingImage && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                    <LoaderCircle size={18} className="animate-spin" />
                    Uploading image...
                    </div>
                )}

                {selectedImage && (
                    <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                        Image Preview
                    </p>

                    <img
                        src={selectedImage}
                        alt="Selected course thumbnail"
                        className="h-40 w-full max-w-sm rounded-xl border border-slate-200 object-cover"
                    />
                    </div>
                )}

                {!selectedImage && form.thumbnail && (
                    <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                        Current Thumbnail
                    </p>

                    <img
                        src={form.thumbnail}
                        alt="Current course thumbnail"
                        className="h-40 w-full max-w-sm rounded-xl border border-slate-200 object-cover"
                    />
                    </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle className="animate-spin" size={18} />
                  )}
                  {saving
                    ? "Saving..."
                    : editingCourse
                      ? "Update Course"
                      : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;

