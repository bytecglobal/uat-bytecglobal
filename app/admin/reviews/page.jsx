"use client";

import { useState, useEffect } from "react";
import { Star, Plus, Edit3, Trash2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    clientName: "",
    companyName: "",
    designation: "",
    reviewText: "",
    rating: 5,
    featured: true,
  });

  const fetchReviews = () => {
    setLoading(true);
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReviews(data.testimonials || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openEdit = (r) => {
    setEditingReview(r);
    setForm({
      clientName: r.clientName,
      companyName: r.companyName || "",
      designation: r.designation || "",
      reviewText: r.reviewText,
      rating: r.rating || 5,
      featured: Boolean(r.featured),
    });
    setShowModal(true);
  };

  const handleTogglePublish = async (review) => {
    const newStatus = review.status === "published" ? "draft" : "published";
    try {
      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, status: newStatus }),
      });
      fetchReviews();
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingReview ? "PATCH" : "POST";
    const body = editingReview ? { id: editingReview.id, ...form } : form;

    try {
      const res = await fetch("/api/admin/reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingReview(null);
        setForm({
          clientName: "",
          companyName: "",
          designation: "",
          reviewText: "",
          rating: 5,
          featured: true,
        });
        fetchReviews();
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/reviews?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchReviews();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Reviews &amp; Client Testimonials
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Curate verified customer endorsements, executive quotes, and star ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingReview(null);
            setForm({ clientName: "", companyName: "", designation: "", reviewText: "", rating: 5, featured: true });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading testimonials...</div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No testimonials published yet.</div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                r.status === "published" ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-[#f5c518]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < (r.rating || 5) ? "fill-[#f5c518]" : "text-gray-300"}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(r)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                      title={r.status === "published" ? "Unpublish" : "Publish"}
                    >
                      {r.status === "published" ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(r.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-700 italic leading-relaxed mt-2">&ldquo;{r.reviewText}&rdquo;</p>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-gray-900">{r.clientName}</div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    {r.designation} {r.companyName ? `· ${r.companyName}` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.status}
                </span>
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
          title={editingReview ? "Edit Testimonial" : "Add Testimonial"}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  placeholder="e.g. David Sterling"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Nexus Global Supply"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Chief Operating Officer"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Star Rating (1-5)</label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                >
                  <option value={5}>5 Stars (Exceptional)</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Endorsement / Quote *</label>
              <textarea
                rows={4}
                required
                value={form.reviewText}
                onChange={(e) => setForm({ ...form, reviewText: e.target.value })}
                placeholder="BytecGlobal replaced our disjointed spreadsheets with a clean ERP..."
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
                Save Testimonial
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
        title="Delete Testimonial"
        message="Are you sure you want to remove this client review?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
