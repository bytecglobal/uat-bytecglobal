"use client";

import { useState, useEffect } from "react";
import { Mail, Send, RotateCcw, AlertTriangle, CheckCircle2, Clock, XCircle, Search, Plus, FileCode } from "lucide-react";
import { Modal } from "@/components/admin/modal";

export default function EmailsManagementPage() {
  const [emails, setEmails] = useState([]);
  const [provider, setProvider] = useState({ configured: false, status: "" });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [retryingId, setRetryingId] = useState(null);

  const [composeForm, setComposeForm] = useState({
    to: "",
    subject: "",
    category: "Follow-up Emails",
    body: "",
  });

  const fetchEmails = () => {
    setLoading(true);
    fetch(`/api/admin/emails?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmails(data.emails || []);
          if (data.provider) setProvider(data.provider);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmails();
    fetch("/api/admin/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTemplates(data.templates || []);
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleApplyTemplate = (templateId) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setComposeForm({
      ...composeForm,
      subject: tpl.subject,
      body: tpl.content,
      category: tpl.category || composeForm.category,
    });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowComposeModal(false);
        setComposeForm({ to: "", subject: "", category: "Follow-up Emails", body: "" });
        fetchEmails();
      }
    } catch {}
  };

  const handleRetry = async (emailId) => {
    setRetryingId(emailId);
    try {
      await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", emailId }),
      });
      fetchEmails();
    } catch {}
    setRetryingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Transactional Email Communications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Corporate message dispatch, template auto-replies, and provider delivery logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComposeModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Send size={14} />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Provider Status Banner */}
      <div
        className={`rounded-2xl border p-4 text-xs flex items-center justify-between ${
          provider.configured
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-3">
          {provider.configured ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          )}
          <div>
            <div className="font-bold">Transactional Provider (Resend): {provider.status}</div>
            <div className="text-[11px] opacity-80">
              {provider.configured
                ? "Live verified API integration active for outward customer communications."
                : "Outgoing emails require a valid RESEND_API_KEY in .env.local before live dispatch is confirmed."}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "sent", "failed", "draft"].map((st) => (
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

      {/* Emails Log Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject &amp; Category</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Provider Response</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading email dispatch history...</td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">No email delivery logs recorded yet.</td>
                </tr>
              ) : (
                emails.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{e.to}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{e.subject}</div>
                      <span className="text-[10px] text-gray-400">{e.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          e.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : e.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px] max-w-[220px] truncate" title={e.providerResponse}>
                      {e.providerResponse || "No response recorded"}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {e.sentAt ? new Date(e.sentAt).toLocaleString() : "Not sent"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {e.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => handleRetry(e.id)}
                          disabled={retryingId === e.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition"
                        >
                          <RotateCcw size={12} className={retryingId === e.id ? "animate-spin" : ""} />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <Modal
          isOpen={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          title="Compose Corporate Email"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
            {templates.length > 0 && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Load From Template</label>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                >
                  <option value="">Select a pre-configured template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Recipient Email *</label>
              <input
                type="email"
                required
                value={composeForm.to}
                onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                placeholder="client@company.com"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Subject Line *</label>
              <input
                type="text"
                required
                value={composeForm.subject}
                onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                placeholder="e.g. Following up on your software modernization inquiry"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Message Content *</label>
              <textarea
                rows={7}
                required
                value={composeForm.body}
                onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                placeholder="Dear client, ..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#29251b] px-5 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
              >
                <Send size={13} />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
