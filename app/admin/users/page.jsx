"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Edit3, Trash2, Shield, Lock, CheckCircle2, AlertTriangle, Key } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

const ROLE_BADGES = {
  SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200",
  ADMIN: "bg-[#29251b] text-[#f5c518] font-bold",
  EDITOR: "bg-blue-100 text-blue-800 border-blue-200",
  MANAGER: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const method = editingUser ? "PATCH" : "POST";
    const body = editingUser ? { id: editingUser.id, ...form } : form;

    try {
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Action failed.");
        return;
      }

      setShowModal(false);
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      fetchUsers();
    } catch {
      setErrorMsg("Failed to communicate with authentication server.");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: newStatus }),
      });
      fetchUsers();
    } catch {}
  };

  const handleResetLockout = async (user) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, resetLockout: true }),
      });
      fetchUsers();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTargetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete user.");
      }
      setDeleteTargetId(null);
      fetchUsers();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Admin User &amp; Role Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Server-enforced Role-Based Access Control (RBAC) across Super Admin, Admin, Editor, and Manager tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setErrorMsg("");
            setForm({ name: "", email: "", password: "", role: "ADMIN" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Create Admin User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-w-5xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading admin roster...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5c518] font-bold text-xs text-[#1c1a16]">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${ROLE_BADGES[u.role] || "bg-gray-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isLocked ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-bold">
                          <AlertTriangle size={13} />
                          <span>Locked</span>
                          <button
                            type="button"
                            onClick={() => handleResetLockout(u)}
                            className="underline text-[10px] font-mono text-gray-500 hover:text-gray-800 ml-1"
                          >
                            (Unlock)
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.status}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never logged in"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setErrorMsg("");
                            setForm({ name: u.name, email: u.email, password: "", role: u.role });
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-900 transition"
                          title="Edit user"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(u.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Delete user"
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

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? `Edit Account: ${editingUser.name}` : "Create Admin Account"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-50 p-3 text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Samantha Wright"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                disabled={Boolean(editingUser)}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@bytecglobal.com"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {editingUser ? "Reset Password (leave empty to keep current)" : "Password *"}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Role &amp; Privilege Level *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full System &amp; Security Access)</option>
                <option value="ADMIN">ADMIN (Operations, CMS, CRM, Analytics)</option>
                <option value="EDITOR">EDITOR (Website CMS, Media &amp; SEO)</option>
                <option value="MANAGER">MANAGER (Leads, Meetings &amp; Client Projects)</option>
              </select>
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
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Revoke Admin Account"
        message="Are you sure you want to delete this administrator account?"
        confirmText="Revoke Account"
        isDanger={true}
      />
    </div>
  );
}
