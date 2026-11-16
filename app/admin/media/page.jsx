"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Upload, Search, Trash2, Copy, Check, File, ExternalLink } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/modal";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchMedia = () => {
    setLoading(true);
    fetch("/api/admin/media")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMedia(data.media || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "website-asset");
    formData.append("altText", file.name);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchMedia();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {}
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/media?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      fetchMedia();
    } catch {}
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = media.filter((m) =>
    (m.originalName || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Media &amp; Asset Library
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Secure asset repository for corporate brand marks, client logos, case study graphics, and PDFs.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs cursor-pointer">
            <Upload size={14} className={uploading ? "animate-bounce" : ""} />
            <span>{uploading ? "Uploading..." : "Upload File"}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
            />
          </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media assets by filename or category..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading media library...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No media assets found.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Media Thumbnail */}
              <div className="h-32 bg-gray-50 flex items-center justify-center p-3 relative overflow-hidden">
                {item.mimeType?.startsWith("image/") ? (
                  <img
                    src={item.path}
                    alt={item.altText || item.originalName}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <File size={36} className="text-gray-400" />
                )}
              </div>

              {/* Asset Info */}
              <div className="p-3 text-xs border-t border-gray-100">
                <div className="font-bold text-gray-900 truncate" title={item.originalName}>
                  {item.originalName}
                </div>
                <div className="text-[10px] text-gray-400 font-mono flex justify-between mt-1">
                  <span>{(item.size / 1024).toFixed(1)} KB</span>
                  <span className="uppercase">{item.mimeType?.split("/")[1]}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.path, item.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-[#806000]"
                    title="Copy Public URL"
                  >
                    {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedId === item.id ? "Copied" : "Copy URL"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                    title="Delete file"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Media File"
        message="Are you sure you want to permanently delete this media asset?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
