
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const stats = [
  {
    title: "Total Students",
    value: "0",
    description: "Registered learners",
    icon: GraduationCap,
    color: "purple",
  },
  {
    title: "Staff Members",
    value: "0",
    description: "Sales and support",
    icon: Users,
    color: "blue",
  },
  {
    title: "Total Courses",
    value: "0",
    description: "Courses created",
    icon: BookOpen,
    color: "green",
  },
  {
    title: "Learning Activity",
    value: "0",
    description: "Activity overview",
    icon: TrendingUp,
    color: "orange",
  },
];

function AdminDashboard() {
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

      <section className="stats-grid">
        {stats.map(({ title, value, description, icon: Icon, color }) => (
          <article className="stat-card" key={title}>
            <div className={`stat-icon ${color}`}>
              <Icon size={22} />
            </div>

            <p className="stat-title">{title}</p>
            <h2>{value}</h2>
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
              onClick={() => window.location.assign("/admin/staff")}
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
              onClick={() => window.location.assign("/admin/courses")}
              className="quick-action"
            >
              <div className="quick-action-icon">
                <BookOpen size={20} />
              </div>
              <div>
                <strong>Manage Courses</strong>
                <p>Course management will be connected later</p>
              </div>
              <ArrowUpRight size={19} />
            </button>
          </div>
        </article>

        <article className="dashboard-panel activity-panel">
          <h2>Platform Activity</h2>
          <p>Your dashboard is ready to be connected to live data.</p>

          <div className="activity-empty">
            <div className="activity-empty-icon">
              <TrendingUp size={25} />
            </div>
            <strong>No activity data yet</strong>
            <p>Live statistics will appear here after API integration.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
