
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, BookOpen, Send } from "lucide-react";

import {
  getMyLeads,
  getLeadNotes,
  addLeadNote,
  updateLead,
} from "../../services/leadService";

function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [updating, setUpdating] = useState(false);
const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await getMyLeads();

        const selectedLead = response.leads.find(
          (item) => item._id === leadId
        );

        if (!selectedLead) {
          setError("Lead not found or access denied");
          return;
        }

        setLead(selectedLead);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load lead details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  useEffect(() => {
  const fetchNotes = async () => {
    try {
      setNoteLoading(true);
      const response = await getLeadNotes(leadId);
      setNotes(response.notes || []);
    } catch (err) {
      setNoteError(
        err.response?.data?.message || "Failed to load notes"
      );
    } finally {
      setNoteLoading(false);
    }
  };

  fetchNotes();
    }, [leadId]);

    const handleAddNote = async (e) => {
    e.preventDefault();

    if (!noteContent.trim()) return;

    try {
        setNoteSaving(true);
        setNoteError("");

        const response = await addLeadNote(leadId, noteContent);

        setNotes((prev) => [response.note, ...prev]);
        setNoteContent("");
    } catch (err) {
        setNoteError(
        err.response?.data?.message || "Failed to add note"
        );
    } finally {
        setNoteSaving(false);
    }
    };

    const handleLeadUpdate = async (field, value) => {
    try {
        setUpdating(true);
        setUpdateMessage("");

        const result = await updateLead(leadId, {
        [field]: value,
        });

        setLead((prev) => ({
        ...prev,
        ...result.lead,
        }));

        setUpdateMessage("Updated successfully!");
    } catch (error) {
        setUpdateMessage(
        error.response?.data?.message || "Update failed"
        );
    } finally {
        setUpdating(false);
    }
    };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading lead details...</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || "Lead not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600"
        >
          Go back
        </button>
      </div>
    );
  }

  const student = lead.student;
  const course = lead.course;

  return (
    <div className="dashboard-content space-y-6">
    <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
        <ArrowLeft size={18} />
        Back to Leads
    </button>

    <div>
        <h1 className="text-2xl font-bold text-gray-900">
        Lead Details
        </h1>
        <p className="mt-1 text-sm text-gray-500">
        View student and enrollment information.
        </p>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold text-gray-900">
            Student Information
        </h2>

        <h3 className="text-xl font-bold text-gray-900">
            {student?.name}
        </h3>

        <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p className="flex items-center gap-2">
            <Mail size={17} />
            {student?.email}
            </p>

            <p className="flex items-center gap-2">
            <Phone size={17} />
            {student?.mobile || "Not available"}
            </p>
        </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold text-gray-900">
            Course Information
        </h2>

        <div className="flex items-start gap-4">
            {course?.thumbnail && (
            <img
                src={course.thumbnail}
                alt={course.title}
                className="h-20 w-24 rounded-lg object-cover"
            />
            )}

            <div>
            <h3 className="font-semibold text-gray-900">
                {course?.title}
            </h3>

            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <BookOpen size={16} />
                {course?.price === 0
                ? "Free Course"
                : `₹${course?.price}`}
            </p>
            </div>
        </div>
        </div>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-6">
    <h2 className="mb-5 font-semibold text-gray-900">
        Lead Information
    </h2>

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Lead Status */}
        <div>
        <label className="text-sm text-gray-500">
            Lead Status
        </label>

        <select
            value={lead.status}
            onChange={(e) =>
            handleLeadUpdate("status", e.target.value)
            }
            disabled={updating}
            className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
        >
            {[
            "new",
            "contacted",
            "follow_up",
            "completed",
            "interested",
            "payment_pending",
            "not_interested",
            ].map((status) => (
            <option key={status} value={status}>
                {status.replaceAll("_", " ").toUpperCase()}
            </option>
            ))}
        </select>
        </div>

        {/* Lead Temperature */}
        <div>
        <label className="text-sm text-gray-500">
            Lead Temperature
        </label>

        <select
            value={lead.temperature}
            onChange={(e) =>
            handleLeadUpdate("temperature", e.target.value)
            }
            disabled={updating}
            className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
        >
            <option value="cold">COLD</option>
            <option value="warm">WARM</option>
        </select>
        </div>

        {/* Enrolled Date */}
        <div>
        <p className="text-sm text-gray-500">
            Enrolled Date
        </p>

        <p className="mt-2 font-semibold text-gray-900">
            {new Date(lead.createdAt).toLocaleDateString()}
        </p>
        </div>
    </div>

    {updating && (
        <p className="mt-3 text-sm text-blue-600">
        Updating...
        </p>
    )}

    {updateMessage && (
        <p className="mt-3 text-sm text-green-600">
        {updateMessage}
        </p>
    )}
    </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold text-gray-900">
            Lead Notes
        </h2>

        <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your discussion notes..."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
            />

            <div className="flex justify-end">
            <button
                type="submit"
                disabled={noteSaving || !noteContent.trim()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
                <Send size={16} />
                {noteSaving ? "Saving..." : "Add Note"}
            </button>
            </div>
        </form>

        {noteError && (
            <p className="mt-3 text-sm text-red-500">{noteError}</p>
        )}

        <div className="mt-6 space-y-4">
            {noteLoading ? (
            <p className="text-sm text-gray-500">Loading notes...</p>
            ) : notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes added yet.</p>
            ) : (
            notes.map((note) => (
                <div key={note._id} className="rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {note.content}
                </p>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                    <span>{note.createdBy?.name || "Staff"}</span>
                    <span>
                    {new Date(note.createdAt).toLocaleString()}
                    </span>
                </div>
                </div>
            ))
            )}
        </div>
        </div>

    </div>
  );
}

export default LeadDetails;
