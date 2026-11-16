"use client";

import { useState, useEffect } from "react";
import { Navigation, Plus, Edit3, Trash2, CheckCircle2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/admin/modal";

export default function NavigationCMSPage() {
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [form, setForm] = useState({
    label: "",
    href: "",
    dropdown: false,
  });

  const fetchNav = () => {
    setLoading(true);
    fetch("/api/admin/cms?section=navigation")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNavItems(data.navigation || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNav();
  }, []);

  const handleToggle = async (item) => {
    const updated = navItems.map((n) =>
      n.id === item.id ? { ...n, visibility: !n.visibility } : n
    );
    setNavItems(updated);
    saveNavigation(updated);
  };

  const handleMove = async (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === navItems.length - 1)) return;
    const updated = [...navItems];
    const targetIdx = index + direction;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setNavItems(updated);
    saveNavigation(updated);
  };

  const saveNavigation = async (items) => {
    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "navigation", data: items, publish: true }),
      });
      setSavedMessage("Navigation order saved and published live!");
      setTimeout(() => setSavedMessage(""), 3500);
      fetchNav();
    } catch {}
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    let updated;
    if (editingItem) {
      updated = navItems.map((n) =>
        n.id === editingItem.id ? { ...n, label: form.label, href: form.href, dropdown: form.dropdown } : n
      );
    } else {
      updated = [
        ...navItems,
        {
          id: `nav_${Date.now()}`,
          label: form.label,
          href: form.href,
          dropdown: form.dropdown,
          visibility: true,
          displayOrder: navItems.length + 1,
        },
      ];
    }
    setShowModal(false);
    saveNavigation(updated);
  };

  const handleDelete = (id) => {
    const updated = navItems.filter((n) => n.id !== id);
    saveNavigation(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Header Navigation Bar CMS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage links, dropdown menus, reorder hierarchy, and visibility for the corporate header.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setForm({ label: "", href: "", dropdown: false });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Nav Item</span>
        </button>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Nav List Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-w-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Order</th>
                <th className="py-3 px-4">Menu Label</th>
                <th className="py-3 px-4">Target URL</th>
                <th className="py-3 px-4">Dropdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading navigation...</td>
                </tr>
              ) : (
                navItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-400">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:text-gray-900 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === navItems.length - 1}
                          className="p-1 hover:text-gray-900 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">{item.label}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{item.href}</td>
                    <td className="py-3 px-4">
                      {item.dropdown ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Mega Dropdown
                        </span>
                      ) : (
                        <span className="text-gray-400">Direct Link</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          item.visibility !== false ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.visibility !== false ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setForm({ label: item.label, href: item.href, dropdown: Boolean(item.dropdown) });
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-900 transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingItem ? "Edit Navigation Item" : "Add Navigation Item"}
        >
          <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Menu Label *</label>
              <input
                type="text"
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Services"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target URL *</label>
              <input
                type="text"
                required
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/services or https://..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.dropdown}
                onChange={(e) => setForm({ ...form, dropdown: e.target.checked })}
                className="rounded text-[#f5c518] focus:ring-[#f5c518]"
              />
              <span className="font-semibold text-gray-800">Has Services Mega Menu Dropdown</span>
            </label>
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
                Save Nav Item
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
