"use client";

import { useState, useEffect } from "react";
import { Newspaper, Plus, Trash2, Mail, CheckCircle2, UserX } from "lucide-react";
import { Modal } from "@/components/admin/modal";

export default function NewsletterManagementPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const fetchSubscribers = () => {
    setLoading(true);
    fetch("/api/admin/newsletter")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubscribers(data.subscribers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewEmail("");
        fetchSubscribers();
      }
    } catch {}
  };

  const handleRemove = async (id) => {
    try {
      await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      fetchSubscribers();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Newsletter &amp; Technology Subscribers
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Opt-in engineering briefs, quarterly technology whitepapers, and subscriber consent logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Subscriber Email</th>
                <th className="py-3 px-4">Subscribed At</th>
                <th className="py-3 px-4">Campaigns Dispatched</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">Loading subscribers...</td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">No subscribers registered yet.</td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{s.email}</td>
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                      {new Date(s.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">{s.campaignsReceived || 0}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(s.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Unsubscribe / Remove"
                      >
                        <UserX size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add Verified Subscriber"
        >
          <form onSubmit={handleAddSubscriber} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Subscriber Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="subscriber@enterprise.com"
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
                Add Subscriber
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
