"use client";

import { useState, useEffect } from "react";
import { FileCode, Plus, Edit3, Trash2, Copy, Eye, CheckCircle2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";
import { renderTemplatePlaceholders } from "@/lib/template-utils";

const CATEGORIES = [
  "Inquiry Confirmation",
  "Meeting Confirmation",
  "Follow-up",
  "Notification",
  "Project Update",
];

const AVAILABLE_PLACEHOLDERS = [
  "{{customer_name}}",
  "{{customer_email}}",
  "{{company_name}}",
  "{{service_name}}",
  "{{meeting_date}}",
  "{{meeting_link}}",
  "{{project_name}}",
];

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "Inquiry Confirmation",
    subject: "",
    content: "",
  });

  const fetchTemplates = () => {
    setLoading(true);
    fetch(`/api/admin/templates?category=${categoryFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingTemplate ? "PATCH" : "POST";
    const body = editingTemplate ? { id: editingTemplate.id, ...form } : form;

    try {
      const res = await fetch("/api/admin/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingTemplate(null);
        setForm({ name: "", category: "Inquiry Confirmation", subject: "", content: "" });
        fetchTemplates();
      }
    } catch {}
  };

  const handleDuplicate = async (tpl) => {
    try {
      await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${tpl.name} (Copy)`,
          category: tpl.category,
          subject: tpl.subject,
          content: tpl.content,
        }),
      });
      fetchTemplates();
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/templates?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchTemplates();
    } catch {}
  };

  const openEdit = (tpl) => {
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name,
      category: tpl.category,
      subject: tpl.subject,
      content: tpl.content,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Message &amp; Email Templates
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic messaging templates with contextual tags for auto-responders and notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTemplate(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>New Template</span>
        </button>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === cat
                ? "bg-[#29251b] text-[#f5c518]"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No templates found in this category.</div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#806000] border border-amber-200">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Preview rendered template"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(tpl)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Duplicate template"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(tpl)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Edit template"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(tpl.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Delete template"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900">{tpl.name}</h3>
                <p className="text-xs font-semibold text-gray-700 mt-1 line-clamp-1">Subject: {tpl.subject}</p>
                <p className="text-xs text-gray-500 font-mono mt-2 line-clamp-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {tpl.content}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1 border-t border-gray-100 pt-3">
                {(tpl.placeholders || []).map((ph) => (
                  <span key={ph} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                    {`{{${ph}}}`}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rendered Live Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          title={`Rendered Preview: ${previewTemplate.name}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Simulated Subject</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">
                {renderTemplatePlaceholders(previewTemplate.subject, {
                  customerName: "Alex Mercer",
                  companyName: "Horizon Dynamics",
                  serviceName: "Custom AI Platform",
                  meetingDate: "Nov 25, 2026 at 3:00 PM IST",
                })}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
              {renderTemplatePlaceholders(previewTemplate.content, {
                customerName: "Alex Mercer",
                companyName: "Horizon Dynamics",
                serviceName: "Custom AI Platform",
                meetingDate: "Nov 25, 2026 at 3:00 PM IST",
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTemplate ? "Edit Template" : "Create New Template"}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Inbound Inquiry Fast Confirmation"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Subject *</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Thanks for contacting BytecGlobal, {{customer_name}}"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-gray-700">Message Body *</label>
                <span className="text-[10px] text-gray-400">Insert tag by typing</span>
              </div>
              <textarea
                rows={8}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Hi {{customer_name}}, ..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">Available Dynamic Tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_PLACEHOLDERS.map((ph) => (
                  <span
                    key={ph}
                    onClick={() => setForm({ ...form, content: form.content + " " + ph })}
                    className="cursor-pointer rounded bg-white px-2 py-0.5 text-[10px] font-mono font-medium text-[#806000] border border-gray-200 hover:border-[#f5c518]"
                  >
                    + {ph}
                  </span>
                ))}
              </div>
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
                {editingTemplate ? "Update Template" : "Save Template"}
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
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
