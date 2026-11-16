"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Search, Edit3, Trash2, FolderKanban, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

export default function ClientsManagementPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    industry: "Enterprise Software",
    totalValue: 30000,
    status: "active",
    notes: "",
  });

  const fetchClients = () => {
    setLoading(true);
    fetch(`/api/admin/clients?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setClients(data.clients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingClient ? "PATCH" : "POST";
    const body = editingClient ? { id: editingClient.id, ...form } : form;

    try {
      const res = await fetch("/api/admin/clients", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingClient(null);
        setForm({
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          industry: "Enterprise Software",
          totalValue: 30000,
          status: "active",
          notes: "",
        });
        fetchClients();
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/clients?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchClients();
    } catch {}
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      contactPerson: client.contactPerson || "",
      email: client.email,
      phone: client.phone || "",
      industry: client.industry || "",
      totalValue: client.totalValue || 0,
      status: client.status || "active",
      notes: client.notes || "",
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Corporate Clients
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise client accounts, contractual values, and active delivery projects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingClient(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by company name, contact person, industry..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No corporate clients registered.</div>
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500">{c.contactPerson} · <span className="font-semibold text-gray-700">{c.industry}</span></p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-600 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400" />
                    <a href={`mailto:${c.email}`} className="hover:underline text-gray-800">{c.email}</a>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>

                {/* Linked Projects */}
                <div className="mt-4 border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <FolderKanban size={13} className="text-[#806000]" />
                      <span>Projects ({c.projectsCount || 0})</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">${(c.totalValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    {(c.projects || []).slice(0, 2).map((p) => (
                      <div key={p.id} className="text-[11px] text-gray-500 flex justify-between bg-gray-50 px-2 py-1 rounded">
                        <span className="truncate max-w-[170px]">{p.title}</span>
                        <span className="font-mono text-gray-700 font-semibold">{p.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                  title="Edit client"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(c.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition"
                  title="Delete client"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingClient ? "Edit Client Profile" : "Register New Client"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 800-555-0100"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="Logistics, Fintech, Health..."
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Total Account Value ($)</label>
                <input
                  type="number"
                  value={form.totalValue}
                  onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Internal Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Key agreements, commercial background, or account context..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#29251b] px-5 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
              >
                {editingClient ? "Update Client" : "Register Client"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Client Record"
        message="Are you sure you want to remove this client? Historical projects will remain in the database."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
