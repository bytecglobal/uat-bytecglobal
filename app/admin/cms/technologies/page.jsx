"use client";

import { useState, useEffect } from "react";
import { Cpu, Plus, Edit3, Trash2, CheckCircle2, Save } from "lucide-react";
import { Modal } from "@/components/admin/modal";

export default function TechnologiesCMSPage() {
  const [techGroups, setTechGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [form, setForm] = useState({
    group: "",
    itemsText: "",
  });

  const fetchTech = () => {
    setLoading(true);
    fetch("/api/admin/cms?section=technologies")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTechGroups(data.technologies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTech();
  }, []);

  const openEdit = (group) => {
    setEditingGroup(group);
    setForm({
      group: group.group,
      itemsText: (group.items || []).join(", "),
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const items = form.itemsText.split(",").map((i) => i.trim()).filter(Boolean);

    let updated;
    if (editingGroup) {
      updated = techGroups.map((g) =>
        g.id === editingGroup.id ? { ...g, group: form.group, items } : g
      );
    } else {
      updated = [
        ...techGroups,
        {
          id: `tech_${Date.now()}`,
          group: form.group,
          items,
          visibility: true,
          displayOrder: techGroups.length + 1,
        },
      ];
    }

    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "technologies", data: updated, publish: true }),
      });
      setShowModal(false);
      setSavedMessage("Technology stack updated successfully!");
      setTimeout(() => setSavedMessage(""), 4000);
      fetchTech();
    } catch {}
  };

  const handleDelete = async (groupId) => {
    const updated = techGroups.filter((g) => g.id !== groupId);
    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "technologies", data: updated, publish: true }),
      });
      fetchTech();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Technology Stack &amp; Frameworks
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage frontend, backend, artificial intelligence, and cloud stacks displayed on /technologies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGroup(null);
            setForm({ group: "", itemsText: "" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Tech Category</span>
        </button>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading technologies...</div>
        ) : techGroups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No tech categories defined.</div>
        ) : (
          techGroups.map((g) => (
            <div
              key={g.id || g.group}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <Cpu size={16} className="text-[#806000]" />
                    <span>{g.group}</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title="Edit group"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Delete group"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(g.items || []).map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs font-semibold text-gray-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
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
          title={editingGroup ? `Edit Category: ${editingGroup.group}` : "Add Technology Category"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Category Title *</label>
              <input
                type="text"
                required
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                placeholder="e.g. AI &amp; Machine Learning"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Technologies (Comma separated) *</label>
              <textarea
                rows={4}
                required
                value={form.itemsText}
                onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
                placeholder="React, Next.js, TypeScript, Tailwind CSS"
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
                Save Category
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
