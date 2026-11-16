"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Plus, Clock, Video, CheckCircle2, XCircle, Edit3, Trash2, Link as LinkIcon, Compass } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

const STATUS_COLORS = {
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  rescheduled: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function MeetingsManagementPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    durationMinutes: 30,
    meetingLink: "https://calendly.com/team-bytecglobal/30min",
    notes: "",
  });

  const fetchMeetings = () => {
    setLoading(true);
    fetch(`/api/admin/meetings?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMeetings(data.meetings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter]);

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowScheduleModal(false);
        setForm({
          title: "",
          clientName: "",
          clientEmail: "",
          date: new Date().toISOString().split("T")[0],
          time: "14:00",
          durationMinutes: 30,
          meetingLink: "https://calendly.com/team-bytecglobal/30min",
          notes: "",
        });
        fetchMeetings();
      }
    } catch {}
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      const res = await fetch("/api/admin/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: meetingId, status: newStatus }),
      });
      if (res.ok) fetchMeetings();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/meetings?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchMeetings();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Meeting &amp; Consultation Bookings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Discovery calls, architecture sessions, and scheduled client reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Calendly Integration Notice Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900">
        <div className="flex items-center gap-3">
          <Compass size={18} className="text-[#806000] shrink-0" />
          <span>
            <strong>External Scheduler Connected:</strong> BytecGlobal Calendly link is configured across the website navigation and footer.
          </span>
        </div>
        <a
          href="https://calendly.com/team-bytecglobal/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold text-[#806000]"
        >
          View Public Booking Page &rarr;
        </a>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {["all", "confirmed", "requested", "rescheduled", "completed", "cancelled"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              statusFilter === st
                ? "bg-[#29251b] text-[#f5c518]"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Meetings Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Session Title</th>
                <th className="py-3 px-4">Client / Inquirer</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Meeting Link</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading scheduled meetings...</td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">No scheduled meetings matching filter.</td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">{m.title}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{m.clientName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{m.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      <div className="flex items-center gap-1 font-bold">
                        <Clock size={12} className="text-[#806000]" />
                        <span>{m.date} at {m.time}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{m.durationMinutes} mins</span>
                    </td>
                    <td className="py-3 px-4">
                      {m.meetingLink ? (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#806000] hover:underline font-mono text-[11px]"
                        >
                          <Video size={13} />
                          <span>Join Session</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">Direct Call</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={m.status}
                        onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize focus:outline-none ${STATUS_COLORS[m.status] || "bg-gray-100"}`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="requested">Requested</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(m.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Cancel meeting"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule New Client Meeting"
        >
          <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meeting Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Discovery & Technical Architecture Review"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  placeholder="e.g. David Vance"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Client Email</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meeting Link (Google Meet / Zoom / Calendly)</label>
              <input
                type="text"
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/xyz or calendly url"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Agenda / Meeting Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Key questions, architecture requirements..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#29251b] px-5 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
              >
                Schedule Session
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Cancel Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Remove Meeting"
        message="Are you sure you want to remove this meeting record?"
        confirmText="Remove"
        isDanger={true}
      />
    </div>
  );
}
