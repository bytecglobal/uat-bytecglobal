"use client";

import { useState, useEffect } from "react";
import { Sparkles, Plus, Edit3, Trash2, Eye, ArrowUpRight } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

export default function SolutionsCMSPage() {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSolution, setEditingSolution] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    text: "",
  });

  const fetchSolutions = () => {
    setLoading(true);
    fetch("/api/admin/cms?section=solutions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSolutions(data.solutions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSolutions();
  }, []);

  const openEdit = (sol) => {
    setEditingSolution(sol);
    setForm({ title: sol.title, text: sol.text });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingSolution) {
      const updated = solutions.map((s) =>
        s.id === editingSolution.id ? { ...s, title: form.title, text: form.text } : s
      );
      try {
        await fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "solutions", data: updated, publish: true }),
        });
        setShowModal(false);
        setEditingSolution(null);
        fetchSolutions();
      } catch {}
    } else {
      try {
        await fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "solutions",
            item: { title: form.title, text: form.text },
          }),
        });
        setShowModal(false);
        fetchSolutions();
      } catch {}
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/cms?section=solutions&id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchSolutions();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Business Solutions CMS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage the core business solution cards displayed on the homepage and /solutions section.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSolution(null);
            setForm({ title: "", text: "" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Solution</span>
        </button>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading solutions...</div>
        ) : solutions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No solutions configured.</div>
        ) : (
          solutions.map((sol, idx) => (
            <div
              key={sol.id || idx}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-gray-400">0{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(sol)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Edit solution"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(sol.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Delete solution"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900">{sol.title}</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{sol.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingSolution ? "Edit Solution" : "Create Solution"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Solution Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. ERP &amp; Internal Tools"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                rows={4}
                required
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Brief summary of how this solution delivers business ROI..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
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
                Save &amp; Publish
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
        title="Delete Solution"
        message="Are you sure you want to remove this solution card?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
