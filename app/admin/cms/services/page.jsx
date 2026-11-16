"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, Edit3, Trash2, Eye, EyeOff, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

export default function ServicesCMSPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    tagline: "",
    short: "",
    pointsText: "",
    techText: "",
  });

  const fetchServices = () => {
    setLoading(true);
    fetch("/api/admin/cms?section=services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServices(data.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openEdit = (s) => {
    setEditingService(s);
    setForm({
      title: s.title,
      slug: s.slug,
      tagline: s.tagline || "",
      short: s.short || "",
      pointsText: (s.points || []).join("\n"),
      techText: (s.tech || []).join("\n"),
    });
    setShowModal(true);
  };

  const handleToggleVisibility = async (service) => {
    const updated = services.map((s) =>
      s.id === service.id ? { ...s, visibility: !s.visibility } : s
    );
    setServices(updated);
    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "services", data: updated, publish: true }),
      });
      fetchServices();
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const points = form.pointsText.split("\n").map((p) => p.trim()).filter(Boolean);
    const tech = form.techText.split("\n").map((t) => t.trim()).filter(Boolean);

    if (editingService) {
      const updated = services.map((s) =>
        s.id === editingService.id
          ? { ...s, title: form.title, slug: form.slug, tagline: form.tagline, short: form.short, points, tech }
          : s
      );
      try {
        await fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "services", data: updated, publish: true }),
        });
        setShowModal(false);
        setEditingService(null);
        fetchServices();
      } catch {}
    } else {
      try {
        await fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "services",
            item: { title: form.title, slug: form.slug, tagline: form.tagline, short: form.short, points, tech },
          }),
        });
        setShowModal(false);
        fetchServices();
      } catch {}
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/cms?section=services&id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchServices();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Engineering Services Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage public service lines, deliverables, capabilities, and dedicated landing pages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingService(null);
            setForm({ title: "", slug: "", tagline: "", short: "", pointsText: "", techText: "" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No services configured.</div>
        ) : (
          services.map((s, idx) => (
            <div
              key={s.id || s.slug}
              className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                s.visibility !== false ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-gray-400">0{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(s)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title={s.visibility !== false ? "Hide service" : "Show service"}
                    >
                      {s.visibility !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Edit service details"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(s.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Delete service"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900">{s.title}</h3>
                <p className="text-xs text-[#806000] font-medium mt-0.5">{s.tagline}</p>
                <p className="text-xs text-gray-600 line-clamp-3 mt-2 leading-relaxed">{s.short}</p>

                {/* Key Points snippet */}
                <div className="mt-3 space-y-1">
                  {(s.points || []).slice(0, 2).map((pt, i) => (
                    <div key={i} className="text-[11px] text-gray-500 truncate flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[#f5c518] shrink-0" />
                      <span className="truncate">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="font-mono text-[11px] text-gray-400">/services/{s.slug}</span>
                <a
                  href={`/services/${s.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#806000] hover:underline"
                >
                  <span>View Landing Page</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingService ? `Edit Service: ${editingService.title}` : "Create Service"}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Custom AI Platforms"
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
                  placeholder="custom-ai-platforms"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="High-impact marketing subheadline"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Short Description</label>
              <textarea
                rows={3}
                value={form.short}
                onChange={(e) => setForm({ ...form, short: e.target.value })}
                placeholder="Overview text displayed on cards and search..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Core Deliverables &amp; Points (One per line)</label>
              <textarea
                rows={4}
                value={form.pointsText}
                onChange={(e) => setForm({ ...form, pointsText: e.target.value })}
                placeholder="Custom software: enterprise platforms&#10;API development: REST &amp; cloud services"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tech Stack (One per line)</label>
              <textarea
                rows={3}
                value={form.techText}
                onChange={(e) => setForm({ ...form, techText: e.target.value })}
                placeholder="Frontend: React, Next.js&#10;Backend: Node.js, Python"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
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

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message="Are you sure you want to remove this service from the public directory?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
