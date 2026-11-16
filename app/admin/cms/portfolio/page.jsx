"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, Edit3, Trash2, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

export default function PortfolioCMSPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    tag: "Software",
    summary: "",
    challenge: "",
    solution: "",
    resultsText: "",
    stackText: "",
    featured: true,
  });

  const fetchPortfolio = () => {
    setLoading(true);
    fetch("/api/admin/cms?section=portfolio")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPortfolio(data.portfolio || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      slug: item.slug,
      tag: item.tag || "Software",
      summary: item.summary || "",
      challenge: item.challenge || "",
      solution: item.solution || "",
      resultsText: (item.results || []).join("\n"),
      stackText: (item.stack || []).join(", "),
      featured: Boolean(item.featured),
    });
    setShowModal(true);
  };

  const handleToggleVisibility = async (item) => {
    const updated = portfolio.map((p) =>
      p.id === item.id ? { ...p, visibility: !p.visibility } : p
    );
    setPortfolio(updated);
    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "portfolio", data: updated, publish: true }),
      });
      fetchPortfolio();
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const results = form.resultsText.split("\n").map((r) => r.trim()).filter(Boolean);
    const stack = form.stackText.split(",").map((s) => s.trim()).filter(Boolean);

    if (editingItem) {
      const updated = portfolio.map((p) =>
        p.id === editingItem.id
          ? {
              ...p,
              title: form.title,
              slug: form.slug,
              tag: form.tag,
              summary: form.summary,
              challenge: form.challenge,
              solution: form.solution,
              results,
              stack,
              featured: form.featured,
            }
          : p
      );
      try {
        await fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "portfolio", data: updated, publish: true }),
        });
        setShowModal(false);
        setEditingItem(null);
        fetchPortfolio();
      } catch {}
    } else {
      try {
        await fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "portfolio",
            item: {
              title: form.title,
              slug: form.slug,
              tag: form.tag,
              summary: form.summary,
              challenge: form.challenge,
              solution: form.solution,
              results,
              stack,
              featured: form.featured,
            },
          }),
        });
        setShowModal(false);
        fetchPortfolio();
      } catch {}
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/cms?section=portfolio&id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchPortfolio();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Portfolio &amp; Client Case Studies
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage showcase client projects, architecture challenges, verified results, and tech stacks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setForm({
              title: "",
              slug: "",
              tag: "Software",
              summary: "",
              challenge: "",
              solution: "",
              resultsText: "",
              stackText: "Next.js, Node.js, AWS",
              featured: true,
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Case Study</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading case studies...</div>
        ) : portfolio.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No case studies found.</div>
        ) : (
          portfolio.map((p) => (
            <div
              key={p.id || p.slug}
              className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                p.visibility !== false ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#806000] border border-amber-200">
                    {p.tag}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(p)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title={p.visibility !== false ? "Hide project" : "Show project"}
                    >
                      {p.visibility !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(p.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900">{p.title}</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{p.summary}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(p.stack || []).map((tech, i) => (
                    <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-700">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="font-mono text-[11px] text-gray-400">/projects/{p.slug}</span>
                <a
                  href={`/projects/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#806000] hover:underline"
                >
                  <span>View Story</span>
                  <ArrowUpRight size={12} />
                </a>
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
          title={editingItem ? `Edit Case Study: ${editingItem.title}` : "Create Portfolio Case Study"}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Real-Time Telemetry Portal"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="real-time-telemetry-portal"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Tag</label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="Software, Mobile, AI..."
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={form.stackText}
                  onChange={(e) => setForm({ ...form, stackText: e.target.value })}
                  placeholder="React, Next.js, Node.js, AWS"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Project Summary</label>
              <textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">The Challenge</label>
                <textarea
                  rows={3}
                  value={form.challenge}
                  onChange={(e) => setForm({ ...form, challenge: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">The Solution</label>
                <textarea
                  rows={3}
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Results &amp; Metrics (One per line)</label>
              <textarea
                rows={3}
                value={form.resultsText}
                onChange={(e) => setForm({ ...form, resultsText: e.target.value })}
                placeholder="40% faster inventory reconciliation&#10;Zero data loss"
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
        title="Delete Case Study"
        message="Are you sure you want to remove this case study from the portfolio?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
