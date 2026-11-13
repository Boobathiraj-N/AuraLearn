

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPublishedCourses,
  getMyCourses,
  enrollFreeCourse,
} from "../../services/courseService";
import { startRazorpayPayment } from "../../utils/razorpayPayment";

const categories = [
  "All",
  "Free",
  "Paid",
  "Web Development",
  "AI/ML",
  "Cyber Security",
  "Data Structure",
];

const CourseListing = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [enrollingId, setEnrollingId] = useState(null);
  const [message, setMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState([]);

  const user = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userName = user.name || "Student";
  const avatarLetter = userName.charAt(0).toUpperCase();


useEffect(() => {
  const fetchCourses = async () => {
    try {
      const [courseData, enrolledData] = await Promise.all([
        getPublishedCourses(),
        getMyCourses(),
      ]);

      setCourses(courseData.courses || []);

      // Extract enrolled course IDs
      const ids = (enrolledData.courses || [])
        .map((item) => {
          return item.course?._id || item.course;
        })
        .filter(Boolean)
        .map(String);

      setEnrolledIds(ids);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load courses"
      );
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, []);


  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        course.title?.toLowerCase().includes(searchText) ||
        course.description?.toLowerCase().includes(searchText) ||
        course.category?.toLowerCase().includes(searchText);

      const category = course.category?.toLowerCase() || "";

      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Free" && Number(course.price) === 0) ||
        (activeCategory === "Paid" && Number(course.price) > 0) ||
        (activeCategory === "Web Development" &&
          category.includes("web")) ||
        (activeCategory === "AI/ML" &&
          (category.includes("ai") || category.includes("machine"))) ||
        (activeCategory === "Cyber Security" &&
          category.includes("cyber")) ||
        (activeCategory === "Data Structure" &&
          (category.includes("data") || category.includes("dsa")));

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, activeCategory]);


  const handleEnroll = async (event, course) => {
    event.stopPropagation();
    setMessage("");

    try {
      setEnrollingId(course._id);

      if (Number(course.price) === 0) {
        // Free course enrollment
        const result = await enrollFreeCourse(course._id);

        setEnrolledIds((prev) => [
          ...new Set([...prev, String(course._id)]),
        ]);

        setMessage(result.message || "Successfully enrolled!");
      } else {
        // Paid course enrollment
        const result = await startRazorpayPayment(course._id);

        setEnrolledIds((prev) => [
          ...new Set([...prev, String(course._id)]),
        ]);

        setMessage(
          result.message ||
            "Payment successful! You are now enrolled."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Enrollment failed. Please try again."
      );
    } finally {
      setEnrollingId(null);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login", { replace: true });
  };

  const openCourse = (courseId) => {
    navigate(`/student/courses/${courseId}`);
  };

  const formatDuration = (duration) => {
    if (!duration) return "Self-paced";
    return typeof duration === "number"
      ? `${duration} hours`
      : duration;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-gray-300">
        Loading courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#111114] lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold">
            A
          </div>
          <span className="text-xl font-bold tracking-tight">
            AuraLearn <span className="text-violet-400">AI</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-8">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Learning
          </p>

          <button
            onClick={() => navigate("/student")}
            className="flex w-full items-center gap-3 rounded-xl bg-violet-500/15 px-4 py-3 text-left text-sm font-semibold text-violet-300"
          >
            <span>▦</span>
            Courses
          </button>

          <button
            onClick={() => navigate("/student/my-courses")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <span>▣</span>
            My Courses
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <a
            href="mailto:support@auralearn.com"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg">✉</span>
            Contact Us
          </a>
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-h-screen lg:ml-64">
        {/* Navbar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#09090b]/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-7">
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 font-bold">
                A
              </div>
              <span className="font-bold">
                AuraLearn <span className="text-violet-400">AI</span>
              </span>
            </div>

            {/* Search */}
            <div className="relative hidden max-w-xl flex-1 md:block">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ⌕
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses, topics..."
                className="w-full rounded-xl border border-white/10 bg-[#18181b] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-500"
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold">
                  {avatarLetter}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>

                <span className="text-xs text-gray-400">⌄</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#18181b] p-2 shadow-2xl">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/student/progress");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5"
                  >
                    My Progress
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/change-password");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5"
                  >
                    Change Password
                  </button>

                  <div className="my-2 border-t border-white/10" />

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="px-4 pb-4 md:hidden">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-xl border border-white/10 bg-[#18181b] px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-violet-500"
            />
          </div>

          {/* Mobile Navigation */}
          <div className="flex gap-2 border-t border-white/10 px-4 py-3 lg:hidden">
            <button
              onClick={() => navigate("/student")}
              className="rounded-lg bg-violet-500/15 px-4 py-2 text-sm text-violet-300"
            >
              Courses
            </button>
            <button
              onClick={() => navigate("/student/my-courses")}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
            >
              My Courses
            </button>
            <a
              href="mailto:support@auralearn.com"
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
            >
              Contact
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9">
          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#30205b] via-[#211a3c] to-[#12121b] p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200">
                YOUR LEARNING JOURNEY STARTS HERE
              </span>

              <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl">
                Build your skills.
                <br />
                <span className="text-violet-300">
                  Shape your future.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
                Explore practical courses, learn from structured lessons,
                and move one step closer to your career goals.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-300 sm:text-sm">
                <a href="tel:+910000000000" className="hover:text-white">
                  ☎ Contact Support
                </a>
                <a
                  href="mailto:support@auralearn.com"
                  className="hover:text-white"
                >
                  ✉ support@auralearn.com
                </a>
              </div>
            </div>
          </section>

          {/* Course Filters */}
          <section className="mt-9">
            <div className="mb-4">
              <h2 className="text-xl font-bold sm:text-2xl">
                Explore Courses
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Find the right course for your learning journey.
              </p>
            </div>

            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    activeCategory === category
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "border border-white/10 bg-[#18181b] text-gray-400 hover:border-violet-500/40 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* Feedback */}
          {message && (
            <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
              {message}
            </div>
          )}

          {/* Course Grid */}
          <section className="mt-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredCourses.length}
                </span>{" "}
                courses
              </p>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#111114] py-20 text-center">
                <div className="text-4xl">⌕</div>
                <h3 className="mt-4 text-lg font-semibold">
                  No courses found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try another search or category.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                  }}
                  className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium hover:bg-violet-500"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => {
                  const isFree = Number(course.price) === 0;
                  const isEnrolled = enrolledIds.includes(String(course._id));

                  return (
                    <article
                      key={course._id}
                      onClick={() => openCourse(course._id)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#111114] transition duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/20"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48 overflow-hidden bg-[#202027]">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-gray-600">
                            ◈
                          </div>
                        )}

                        <span
                          className={`absolute left-4 top-4 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                            isFree
                              ? "bg-emerald-500 text-white"
                              : "bg-violet-600 text-white"
                          }`}
                        >
                          {isFree ? "FREE" : "PREMIUM"}
                        </span>

                        <span className="absolute bottom-4 right-4 rounded-md bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur">
                          ◷ {formatDuration(course.duration)}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-violet-400">
                            {course.category || "General"}
                          </span>

                          <span className="text-xs text-amber-400">
                            ★ {course.rating || "New"}
                          </span>
                        </div>

                        <h3 className="mt-3 line-clamp-2 min-h-12 text-lg font-bold leading-6 text-white group-hover:text-violet-300">
                          {course.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                          {course.description || "Explore this course and start learning new skills."}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">
                              Course price
                            </p>
                            <p
                              className={`mt-1 text-lg font-bold ${
                                isFree ? "text-emerald-400" : "text-white"
                              }`}
                            >
                              {isFree ? "Free" : `₹${course.price}`}
                            </p>
                          </div>

                          <button
                            onClick={(event) => handleEnroll(event, course)}
                            disabled={
                              enrollingId === course._id || isEnrolled
                            }
                            className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {enrollingId === course._id
                              ? "Processing..."
                              : isEnrolled
                              ? "Enrolled"
                              : isFree
                              ? "Enroll Now"
                              : "Buy Now"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CourseListing;
