

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authAPI from "../../services/authService";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await authAPI.get("/enrollments/my-courses");
        setCourses(response.data.courses || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load your courses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-300">
        Loading your courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Learning</h1>
            <p className="mt-2 text-slate-400">
              Continue learning from where you left off.
            </p>
          </div>

          <button
            onClick={() => navigate("/student")}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium hover:bg-indigo-500"
          >
            Browse Courses
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mb-4 text-5xl">📚</div>
            <h2 className="text-xl font-semibold">
              No courses yet
            </h2>
            <p className="mt-2 text-slate-400">
              Enroll in a course to start your learning journey.
            </p>
            <button
              onClick={() => navigate("/student")}
              className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium hover:bg-indigo-500"
            >
              Explore Courses
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-400">
              {courses.length} enrolled course
              {courses.length !== 1 ? "s" : ""}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((enrollment) => {
                const course = enrollment.course;

                if (!course) return null;

                const progress = Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      enrollment.progress?.progressPercentage ?? 0
                    )
                  )
                );

                return (
                  <div
                    key={enrollment._id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-indigo-500"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-48 w-full object-cover"
                    />

                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium capitalize text-emerald-400">
                          {enrollment.status}
                        </span>

                        <span className="text-sm font-semibold text-indigo-400">
                          {course.price === 0
                            ? "Free"
                            : `₹${course.price}`}
                        </span>
                      </div>

                      <h2 className="text-lg font-semibold">
                        {course.title}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {course.description}
                      </p>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-slate-400">
                            Your Progress
                          </span>
                          <span className="font-semibold text-white">
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Enrolled on:{" "}
                        {enrollment.enrolledAt
                          ? new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>

                      <button
                        onClick={() =>
                          navigate(
                            `/student/courses/${course._id}/learn`
                          )
                        }
                        className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500"
                      >
                        {progress === 100
                          ? "Review Course"
                          : "Continue Learning"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCourses;



// import { useEffect, useState } from "react";
// import authAPI from "../../services/authService";
// import { useNavigate } from "react-router-dom";

// const MyCourses = () => {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();


//   useEffect(() => {
//     const fetchMyCourses = async () => {
//       try {
//         const response = await authAPI.get(
//           "/enrollments/my-courses"
//         );

//         setCourses(response.data.courses || []);
//       } catch (error) {
//         setError(
//           error.response?.data?.message ||
//             "Failed to load your courses"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMyCourses();
//   }, []);

//   if (loading) {
//     return <p className="p-6">Loading your courses...</p>;
//   }

//   if (error) {
//     return (
//       <p className="p-6 text-red-500">{error}</p>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <h1 className="mb-2 text-3xl font-bold">
//         My Learning
//       </h1>

//       <p className="mb-6 text-gray-600">
//         Continue learning from where you left off.
//       </p>

//       {courses.length === 0 ? (
//         <div className="rounded-xl bg-white p-8 text-center shadow">
//           <h2 className="text-xl font-semibold">
//             No courses yet
//           </h2>
//           <p className="mt-2 text-gray-500">
//             Enroll in a course to start learning.
//           </p>
//         </div>
//       ) : (
//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {courses.map((enrollment) => {
//             const course = enrollment.course;
//             const progress =
//               enrollment.progress?.progressPercentage || 0;

//             return (
//               <div
//                 key={enrollment._id}
//                 className="overflow-hidden rounded-xl bg-white shadow"
//               >
//                 <img
//                   src={course.thumbnail}
//                   alt={course.title}
//                   className="h-48 w-full object-cover"
//                 />

//                 <div className="p-5">
//                   <div className="mb-3 flex items-center justify-between">
//                     <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
//                       {enrollment.status}
//                     </span>

//                     <span className="text-sm font-semibold text-indigo-600">
//                       {course.price === 0
//                         ? "Free"
//                         : `₹${course.price}`}
//                     </span>
//                   </div>

//                   <h2 className="text-xl font-semibold">
//                     {course.title}
//                   </h2>

//                   <p className="mt-2 text-sm text-gray-600">
//                     {course.description}
//                   </p>

//                   <div className="mt-4">
//                     <div className="mb-2 flex justify-between text-sm">
//                       <span>Progress</span>
//                       <span>{progress}%</span>
//                     </div>

//                     <div className="h-2 overflow-hidden rounded-full bg-gray-200">
//                       <div
//                         className="h-full rounded-full bg-indigo-600"
//                         style={{ width: `${progress}%` }}
//                       />
//                     </div>
//                   </div>

//                   <p className="mt-3 text-xs text-gray-500">
//                     Enrolled on:{" "}
//                     {new Date(
//                       enrollment.enrolledAt
//                     ).toLocaleDateString()}
//                   </p>

//                   <button
//                     onClick={() =>
//                         navigate(`/student/courses/${course._id}/learn`)
//                     }
//                     className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
//                     >
//                     Continue Learning
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyCourses;