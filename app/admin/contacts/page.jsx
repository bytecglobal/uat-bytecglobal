"use client";

import { useState, useEffect } from "react";
import { Mail, Search, Download, Trash2, Edit3, MessageSquare, Plus, ArrowRight, UserCheck, Calendar } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

const STATUS_COLORS = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  qualified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  meeting_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  proposal_sent: "bg-indigo-100 text-indigo-800 border-indigo-200",
  converted: "bg-green-100 text-green-900 border-green-300 font-bold",
  lost: "bg-gray-100 text-gray-600 border-gray-200",
  archived: "bg-gray-200 text-gray-500 border-gray-300",
};

export default function ContactsManagementPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchContacts = () => {
    setLoading(true);
    const query = new URLSearchParams({ search, status: statusFilter });
    fetch(`/api/admin/contacts?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setContacts(data.contacts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (contactId, newStatus) => {
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, status: newStatus }),
      });
      if (res.ok) {
        fetchContacts();
        if (selectedContact?.id === contactId) {
          setSelectedContact({ ...selectedContact, status: newStatus });
        }
      }
    } catch {}
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedContact) return;
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedContact.id, noteText: noteInput }),
      });
      const data = await res.json();
      if (data.success) {
        setNoteInput("");
        setSelectedContact(data.contact);
        fetchContacts();
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/contacts?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      if (selectedContact?.id === deleteTargetId) setSelectedContact(null);
      fetchContacts();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Contact &amp; Inquiry Inbox
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real incoming inquiries from the BytecGlobal website contact form and project inquiry portal.
          </p>
        </div>

        <a
          href={`/api/admin/contacts?format=csv&search=${encodeURIComponent(search)}&status=${statusFilter}`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries by client name, email, company, service..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="meeting_scheduled">Meeting Scheduled</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Client / Inquirer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Message Snippet</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading inquiries...</td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">No contact inquiries found.</td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        <a href={`mailto:${c.email}`} className="hover:text-[#806000]">{c.email}</a>
                        {c.phone && <span> · {c.phone}</span>}
                      </div>
                      {c.companyName && <span className="text-[10px] text-gray-400 font-medium">({c.companyName})</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-semibold">{c.service}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[220px] truncate" title={c.message}>
                      {c.message}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold focus:outline-none ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="meeting_scheduled">Meeting Scheduled</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedContact(c)}
                          className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-[#29251b] hover:text-[#f5c518] transition"
                        >
                          View Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(c.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Delete inquiry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedContact && (
        <Modal
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          title={`Inquiry from ${selectedContact.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Email Address</span>
                <p className="font-semibold text-gray-900"><a href={`mailto:${selectedContact.email}`} className="text-[#806000] underline">{selectedContact.email}</a></p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Phone / WhatsApp</span>
                <p className="font-semibold text-gray-900">{selectedContact.phone || "Not specified"}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Company Name</span>
                <p className="font-semibold text-gray-900">{selectedContact.companyName || "Independent"}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Service Interested</span>
                <p className="font-semibold text-gray-900">{selectedContact.service}</p>
              </div>
              {selectedContact.budget && (
                <div>
                  <span className="text-gray-400 font-mono uppercase text-[10px]">Budget Range</span>
                  <p className="font-semibold text-gray-900">{selectedContact.budget}</p>
                </div>
              )}
              {selectedContact.timeline && (
                <div>
                  <span className="text-gray-400 font-mono uppercase text-[10px]">Target Timeline</span>
                  <p className="font-semibold text-gray-900">{selectedContact.timeline}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-1">Full Message / Project Brief</h4>
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedContact.message}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Internal Team Notes &amp; Communication</h4>
              <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                {(!selectedContact.notes || selectedContact.notes.length === 0) ? (
                  <p className="text-gray-400 italic">No notes added yet.</p>
                ) : (
                  selectedContact.notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-bold text-gray-700">{n.author}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add private internal note..."
                  className="flex-1 rounded-xl border border-gray-200 py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="rounded-xl bg-[#29251b] px-4 py-2 font-semibold text-[#f5c518] hover:bg-[#181613] transition"
                >
                  Post Note
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Inquiry Record"
        message="Are you sure you want to permanently delete this contact inquiry? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
