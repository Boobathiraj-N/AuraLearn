
const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} = require("../controllers/admin.controller");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require("../controllers/course.controller");

const {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
} = require("../controllers/module.controller");

const {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson,
} = require("../controllers/lesson.controller");


const {
  createChallenge,
  getChallengesByLesson,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
} = require("../controllers/challenge.controller");


const router = express.Router();

// Staff routes — Admin only
router.post("/staff", protect, authorizeRole("admin"), createStaff);
router.get("/staff", protect, authorizeRole("admin"), getAllStaff);
router.get("/staff/:id", protect, authorizeRole("admin"), getStaffById);

router.put(
  "/staff/:id",
  protect,
  authorizeRole("admin"),
  updateStaff
);

router.patch(
  "/staff/:id/status",
  protect,
  authorizeRole("admin"),
  updateStaffStatus
);

// Course CRUD routes — Admin only
router.post("/courses", protect, authorizeRole("admin"), createCourse);
router.get("/courses", protect, authorizeRole("admin"), getAllCourses);
router.get("/courses/:id", protect, authorizeRole("admin"), getCourseById);
router.put("/courses/:id", protect, authorizeRole("admin"), updateCourse);
router.delete("/courses/:id", protect, authorizeRole("admin"), deleteCourse);


 // Module CRUD routes — Admin only
router.post("/modules", protect, authorizeRole("admin"), createModule);

router.get(
  "/courses/:courseId/modules",
  protect,
  authorizeRole("admin"),
  getModulesByCourse
);

router.get(
  "/modules/:id",
  protect,
  authorizeRole("admin"),
  getModuleById
);

router.put(
  "/modules/:id",
  protect,
  authorizeRole("admin"),
  updateModule
);

router.delete(
  "/modules/:id",
  protect,
  authorizeRole("admin"),
  deleteModule
);


/* LESSON ROUTES */
router.post(
  "/lessons",
  protect,
  authorizeRole("admin"),
  createLesson
);

router.get(
  "/modules/:moduleId/lessons",
  protect,
  authorizeRole("admin"),
  getLessonsByModule
);

router.get(
  "/lessons/:id",
  protect,
  authorizeRole("admin"),
  getLessonById
);

router.put(
  "/lessons/:id",
  protect,
  authorizeRole("admin"),
  updateLesson
);

router.delete(
  "/lessons/:id",
  protect,
  authorizeRole("admin"),
  deleteLesson
);


/* CHALLENGE ROUTES */
router.post(
  "/challenges",
  protect,
  authorizeRole("admin"),
  createChallenge
);

router.get(
  "/lessons/:lessonId/challenges",
  protect,
  authorizeRole("admin"),
  getChallengesByLesson
);

router.get(
  "/challenges/:id",
  protect,
  authorizeRole("admin"),
  getChallengeById
);

router.put(
  "/challenges/:id",
  protect,
  authorizeRole("admin"),
  updateChallenge
);

router.delete(
  "/challenges/:id",
  protect,
  authorizeRole("admin"),
  deleteChallenge
);




module.exports = router;
