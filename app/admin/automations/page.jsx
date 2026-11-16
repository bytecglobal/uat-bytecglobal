"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Play, CheckCircle2, XCircle, Clock, Trash2, ArrowRight, ToggleLeft, ToggleRight, Layers, ShieldCheck } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

const TRIGGERS = [
  { id: "contact_submit", label: "When a customer submits Contact Form" },
  { id: "new_lead", label: "When a new Lead is created" },
  { id: "meeting_booked", label: "When a Meeting is confirmed" },
  { id: "lead_followup", label: "When a Lead follow-up is due" },
  { id: "project_completed", label: "When a Project is marked Completed" },
];

export default function AutomationsManagementPage() {
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [testingTrigger, setTestingTrigger] = useState(null);

  const [form, setForm] = useState({
    name: "",
    trigger: "contact_submit",
    description: "",
  });

  const fetchAutomations = () => {
    setLoading(true);
    fetch("/api/admin/automations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAutomations(data.automations || []);
          setLogs(data.logs || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id, currentEnabled) => {
    try {
      await fetch("/api/admin/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });
      fetchAutomations();
    } catch {}
  };

  const handleTestTrigger = async (trigger) => {
    setTestingTrigger(trigger);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_trigger",
          trigger,
          testPayload: {
            name: "Automated Verification Test",
            email: "qa-test@bytecglobal.com",
            service: "Software Development",
            companyName: "Bytec Automation Lab",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Workflow test trigger executed successfully! Check execution logs below.");
        fetchAutomations();
      }
    } catch {}
    setTestingTrigger(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({ name: "", trigger: "contact_submit", description: "" });
        fetchAutomations();
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/automations?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchAutomations();
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Business Automation Workflows
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Event-driven triggers, automated lead creation, in-app admin alerts, and email notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Active Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading workflows...</div>
        ) : automations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No active workflows configured.</div>
        ) : (
          automations.map((aut) => (
            <div
              key={aut.id}
              className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                aut.enabled ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-[#806000]">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{aut.name}</h3>
                      <span className="text-[10px] font-mono font-semibold text-[#806000] uppercase">
                        Trigger: {aut.trigger.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(aut.id, aut.enabled)}
                    className="text-gray-500 hover:text-gray-900 transition"
                    title={aut.enabled ? "Disable workflow" : "Enable workflow"}
                  >
                    {aut.enabled ? (
                      <ToggleRight size={28} className="text-[#f5c518]" />
                    ) : (
                      <ToggleLeft size={28} className="text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs text-gray-600 leading-relaxed">{aut.description}</p>

                {/* Actions flow */}
                <div className="mt-4 rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-1.5 block">
                    Execution Steps
                  </span>
                  <div className="space-y-1">
                    {(aut.actions || []).map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f5c518]" />
                        <span className="capitalize">{action.type.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <span className="text-gray-400 font-mono text-[11px]">
                  Fired {aut.executionCount || 0} times
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestTrigger(aut.trigger)}
                    disabled={testingTrigger === aut.trigger}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-[#29251b] hover:text-[#f5c518] transition"
                  >
                    <Play size={11} className={testingTrigger === aut.trigger ? "animate-spin" : ""} />
                    <span>Test Run</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(aut.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution Logs */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 mb-1">Execution History &amp; Audit</h2>
        <p className="text-xs text-gray-500 mb-4">Latest automated workflow execution logs</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Workflow</th>
                <th className="py-2.5 px-3">Trigger Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">No logs recorded yet.</td>
                </tr>
              ) : (
                logs.slice(0, 10).map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{l.automationName}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">{l.trigger}</td>
                    <td className="py-2.5 px-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        l.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{l.details}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Workflow Automation"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Workflow Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Inbound Inquiry Auto-Lead & Dispatch"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Trigger Event *</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Workflow Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe intended actions, follow-ups, and notifications..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#29251b] px-5 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
              >
                Save Automation
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
        title="Delete Workflow"
        message="Are you sure you want to delete this automation?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
