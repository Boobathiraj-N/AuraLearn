
import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../../services/adminService";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    learningActivity: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDashboardStats();

        setStats(response.stats);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load dashboard statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      description: "Registered learners",
      icon: GraduationCap,
      color: "purple",
    },
    {
      title: "Staff Members",
      value: stats.totalStaff,
      description: "Sales and support",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      description: "Courses created",
      icon: BookOpen,
      color: "green",
    },
    {
      title: "Learning Activity",
      value: stats.learningActivity,
      description: "Active learners in last 7 days",
      icon: TrendingUp,
      color: "orange",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">OVERVIEW</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's your platform overview.</p>
        </div>

        <span className="dashboard-status">
          <span /> Workspace
        </span>
      </div>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <section className="stats-grid">
        {statCards.map(({ title, value, description, icon: Icon, color }) => (
          <article className="stat-card" key={title}>
            <div className={`stat-icon ${color}`}>
              <Icon size={22} />
            </div>

            <p className="stat-title">{title}</p>

            <h2>
              {loading ? "..." : value}
            </h2>

            <p className="stat-description">{description}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-lower-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your learning platform</p>
            </div>
          </div>

          <div className="quick-action-list">
            <button
              onClick={() => navigate("/admin/staff")}
              className="quick-action"
            >
              <div className="quick-action-icon">
                <Users size={20} />
              </div>
              <div>
                <strong>Manage Staff</strong>
                <p>Create and manage Sales and Support accounts</p>
              </div>
              <ArrowUpRight size={19} />
            </button>

            <button
              onClick={() => navigate("/admin/courses")}
              className="quick-action"
            >
              <div className="quick-action-icon">
                <BookOpen size={20} />
              </div>
              <div>
                <strong>Manage Courses</strong>
                <p>Course management</p>
              </div>
              <ArrowUpRight size={19} />
            </button>
          </div>
        </article>

        <article className="dashboard-panel activity-panel">
          <h2>Platform Activity</h2>
          <p>Your platform learning overview.</p>

          <div className="activity-empty">
            <div className="activity-empty-icon">
              <TrendingUp size={25} />
            </div>
            <strong>
              {loading ? "Loading activity..." : `${stats.learningActivity} active learners`}
            </strong>
            <p>Students active during the last 7 days.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
