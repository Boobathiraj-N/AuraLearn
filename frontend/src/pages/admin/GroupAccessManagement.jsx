import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  Search,
  Loader2,
  UserCheck,
  Save,
  X,
  Check,
  UserPlus,
  BookOpen,
} from "lucide-react";

import {
  getAllGroups,
  getActiveSupportStaff,
  assignSupportToGroup,
} from "../../services/groupService";

function GroupAccessManagement() {
  const [groups, setGroups] = useState([]);
  const [supportStaff, setSupportStaff] = useState([]);
  const [selectedSupport, setSelectedSupport] = useState({});
  const [search, setSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [groupsResponse, staffResponse] = await Promise.all([
        getAllGroups(),
        getActiveSupportStaff(),
      ]);

      const fetchedGroups = groupsResponse.data || [];

      setGroups(fetchedGroups);
      setSupportStaff(staffResponse.data || []);

      const initialSelections = {};

      fetchedGroups.forEach((group) => {
        initialSelections[group._id] = (
          group.assignedSupport || []
        ).map((staff) => staff._id);
      });

      setSelectedSupport(initialSelections);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load group access data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStaffToggle = (groupId, supportId) => {
    setSelectedSupport((previous) => {
      const current = previous[groupId] || [];

      const updated = current.includes(supportId)
        ? current.filter((id) => id !== supportId)
        : [...current, supportId];

      return {
        ...previous,
        [groupId]: updated,
      };
    });
  };

  const handleAssignSupport = async (groupId) => {
    try {
      const supportIds = selectedSupport[groupId] || [];

      if (supportIds.length === 0) {
        setError("Please select at least one support staff");
        return;
      }

      setAssigningId(groupId);
      setError("");
      setSuccess("");

      const response = await assignSupportToGroup(
        groupId,
        supportIds
      );

      setGroups((previous) =>
        previous.map((group) =>
          group._id === groupId
            ? {
                ...group,
                assignedSupport: response.data.assignedSupport,
              }
            : group
        )
      );

      setSuccess("Support team updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to assign support staff"
      );
    } finally {
      setAssigningId(null);
    }
  };

  const filteredGroups = groups.filter((group) => {
    const searchText = search.toLowerCase();

    return (
      group.name?.toLowerCase().includes(searchText) ||
      group.course?.title?.toLowerCase().includes(searchText)
    );
  });

  const assignedCount = groups.filter(
    (group) => group.assignedSupport?.length > 0
  ).length;

  const unassignedCount = groups.length - assignedCount;

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={34} />
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-7 bg-slate-50 p-1 text-slate-900">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-3">
              <ShieldCheck className="text-indigo-500" size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Group Access
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage support staff access to course groups.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Groups</p>
              <h2 className="mt-2 text-3xl font-bold">
                {groups.length}
              </h2>
            </div>
            <div className="rounded-xl bg-indigo-500/15 p-3">
              <Users className="text-indigo-500" size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Assigned Groups</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-500">
                {assignedCount}
              </h2>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <UserCheck className="text-emerald-500" size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Unassigned Groups</p>
              <h2 className="mt-2 text-3xl font-bold text-orange-500">
                {unassignedCount}
              </h2>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-3">
              <UserPlus className="text-orange-500" size={23} />
            </div>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          placeholder="Search courses or groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-500"
        />
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Course Groups
          </h2>
          <span className="text-xs text-slate-500">
            {filteredGroups.length} groups
          </span>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto mb-3 text-slate-500" size={35} />
            <p className="text-slate-500">No course groups found.</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const assigned = group.assignedSupport || [];
            const selectedIds = selectedSupport[group._id] || [];

            const filteredStaff = supportStaff.filter((staff) => {
              const query = (
                staffSearch[group._id] || ""
              ).toLowerCase();

              return (
                staff.name?.toLowerCase().includes(query) ||
                staff.email?.toLowerCase().includes(query)
              );
            });

            const hasChanges =
              [...selectedIds].sort().join(",") !==
              assigned.map((staff) => staff._id).sort().join(",");

            return (
              <div
                key={group._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-black/10"
              >

                {/* Group Header */}
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-500/10">
                    {group.course?.thumbnail ? (
                      <img
                        src={group.course.thumbnail}
                        alt={group.course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="text-indigo-500" size={25} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">
                      {group.course?.title || "Unknown Course"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {group.name}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {group.memberCount || 0} students
                    </p>
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        assigned.length > 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {assigned.length > 0
                        ? `${assigned.length} Staff Assigned`
                        : "No Staff Assigned"}
                    </span>
                  </div>

                </div>

                {/* Assigned Staff */}
                <div className="space-y-4 p-5">

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Assigned Support Team
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Staff members who currently have access to this group.
                    </p>
                  </div>

                  {assigned.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {assigned.map((staff) => (
                        <div
                          key={staff._id}
                          className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-600">
                            {getInitials(staff.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {staff.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {staff.email}
                            </p>
                          </div>

                          <Check className="shrink-0 text-emerald-500" size={17} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                      No support staff assigned yet.
                    </p>
                  )}

                  {/* Staff Selection */}
                  <div className="border-t border-slate-200 pt-5">

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Manage Support Access
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Select multiple staff members.
                        </p>
                      </div>

                      <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600">
                        {selectedIds.length} Selected
                      </span>
                    </div>

                    {/* Staff Search */}
                    <div className="relative mb-3">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="text"
                        placeholder="Search support staff..."
                        value={staffSearch[group._id] || ""}
                        onChange={(e) =>
                          setStaffSearch((previous) => ({
                            ...previous,
                            [group._id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Staff List */}
                    <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">

                      {filteredStaff.map((staff) => {
                        const isSelected = selectedIds.includes(staff._id);

                        return (
                          <button
                            key={staff._id}
                            type="button"
                            onClick={() =>
                              handleStaffToggle(group._id, staff._id)
                            }
                            disabled={assigningId === group._id}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? "border-indigo-500/50 bg-indigo-500/10"
                                : "border-slate-300 bg-slate-50 hover:border-slate-400"
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-900">
                              {getInitials(staff.name)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {staff.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {staff.email}
                              </p>
                            </div>

                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-400"
                              }`}
                            >
                              {isSelected && <Check size={13} />}
                            </div>
                          </button>
                        );
                      })}

                      {filteredStaff.length === 0 && (
                        <p className="col-span-full py-5 text-center text-sm text-slate-500">
                          No support staff found.
                        </p>
                      )}

                    </div>

                    {/* Save */}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <p className="text-xs text-slate-500">
                        Changes will apply after saving.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleAssignSupport(group._id)}
                        disabled={
                          assigningId === group._id ||
                          !hasChanges ||
                          selectedIds.length === 0
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {assigningId === group._id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Assignment
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}

export default GroupAccessManagement;