
import { useEffect, useState } from "react";
import { Search, Users, RefreshCw } from "lucide-react";
import { getMyLeads } from "../../services/leadService";
import { useNavigate } from "react-router-dom";

function LeadManagement() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyLeads();
      setLeads(response.leads || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      lead.student?.name?.toLowerCase().includes(searchValue) ||
      lead.student?.email?.toLowerCase().includes(searchValue) ||
      lead.course?.title?.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatStatus = (status) =>
    status.replaceAll("_", " ");

  return (
    <div className="dashboard-content space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lead Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your assigned students and leads.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Leads</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {leads.length}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">New Leads</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {leads.filter((lead) => lead.status === "new").length}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Warm Leads</p>
          <h2 className="mt-2 text-3xl font-bold text-orange-500">
            {leads.filter((lead) => lead.temperature === "warm").length}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or course..."
              className="w-full py-2.5 text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow Up</option>
            <option value="completed">Completed</option>
            <option value="interested">Interested</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="converted">Converted</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-gray-500">
            Loading leads...
          </p>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchLeads}
              className="mt-3 text-sm font-medium text-blue-600"
            >
              Try again
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="font-medium text-gray-700">No leads found</p>
            <p className="mt-1 text-sm text-gray-500">
              Assigned leads will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Temperature</th>
                  <th className="px-3 py-3">Enrolled Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => navigate(`/${lead.currentTeam}/leads/${lead._id}`)}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-3 py-4">
                      <p className="font-medium text-gray-900">
                        {lead.student?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lead.student?.email}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-sm text-gray-700">
                      {lead.course?.title}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                        {formatStatus(lead.status)}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        lead.temperature === "warm"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {lead.temperature}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadManagement;
