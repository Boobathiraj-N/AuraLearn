
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getMySupportGroups } from "../../services/groupService";

function SupportGroups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMySupportGroups();
        setGroups(response.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load groups"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const filteredGroups = groups.filter((group) => {
    const searchText = search.toLowerCase();

    return (
      group.groupName?.toLowerCase().includes(searchText) ||
      group.course?.title?.toLowerCase().includes(searchText)
    );
  });

  const formatTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-3">
              <MessageCircle className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Groups</h1>
              <p className="text-sm text-gray-400">
                Connect with students and resolve their doubts
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups or courses..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Group List */}
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-5 py-4">
            <h2 className="font-semibold">Your Assigned Groups</h2>
            <p className="mt-1 text-xs text-gray-400">
              {groups.length} groups assigned to you
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading groups...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-16 text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-600" />

              <p className="font-medium text-gray-300">
                {search ? "No matching groups found" : "No groups assigned yet"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try searching with another name"
                  : "Groups assigned by admin will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredGroups.map((group) => (
                <button
                  key={group.groupId}
                  onClick={() =>
                    navigate(`/support/groups/${group.groupId}`)
                  }
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-800/70"
                >
                  {/* Group Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/15">
                    {group.course?.thumbnail ? (
                      <img
                        src={group.course.thumbnail}
                        alt={group.course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="h-6 w-6 text-indigo-400" />
                    )}
                  </div>

                  {/* Group Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate font-semibold text-white">
                        {group.groupName}
                      </h3>

                      <span className="shrink-0 text-xs text-gray-500">
                        {formatTime(group.lastMessageAt)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-indigo-400">
                      {group.course?.title || "Course"}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-gray-400">
                        {group.lastMessage || "No messages yet"}
                      </p>

                      <span className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        {group.memberCount}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportGroups;
