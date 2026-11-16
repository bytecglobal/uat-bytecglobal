"use client";

import { useState, useEffect } from "react";
import { HardDrive, Plus, Download, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/modal";

export default function BackupManagementPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreTargetId, setRestoreTargetId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBackups = () => {
    setLoading(true);
    fetch("/api/admin/backups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBackups(data.backups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(`Snapshot ${data.backup?.filename} created successfully.`);
        fetchBackups();
      } else {
        alert(data.error || "Backup failed.");
      }
    } catch {
      alert("Failed to communicate with backup engine.");
    }
    setCreating(false);
  };

  const handleRestore = async () => {
    if (!restoreTargetId) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", backupId: restoreTargetId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Database successfully restored from snapshot!");
        setRestoreTargetId(null);
        fetchBackups();
      } else {
        alert(data.error || "Restore failed.");
      }
    } catch {
      alert("Failed to communicate with restore service.");
    }
    setRestoring(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Database Snapshots &amp; Backups
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real full-system data snapshots, point-in-time recoveries, and offline JSON archive downloads.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-5 py-2 text-xs font-bold text-[#f5c518] hover:bg-[#181613] transition shadow-xs disabled:opacity-50"
        >
          <Plus size={15} className={creating ? "animate-spin" : ""} />
          <span>{creating ? "Taking Snapshot..." : "Create Full Backup"}</span>
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <HardDrive size={22} className="text-[#806000]" />
          <div>
            <h3 className="font-bold text-gray-900">Atomic File Persistence Engine</h3>
            <p className="text-gray-500 text-[11px]">
              Snapshots capture all CMS pages, contacts, CRM leads, projects, meetings, analytics events, and security logs.
            </p>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-w-5xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Snapshot Filename</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Captured Records</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading backup history...</td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No snapshots created yet. Click &ldquo;Create Full Backup&rdquo; to generate one.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{b.filename}</td>
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                      {new Date(b.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {(b.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-[11px]">
                      {b.recordCounts ? (
                        <span>
                          {b.recordCounts.contacts || 0} contacts · {b.recordCounts.leads || 0} leads · {b.recordCounts.projects || 0} projects
                        </span>
                      ) : (
                        "Full database"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/admin/backups?download=${b.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
                          title="Download snapshot JSON"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setRestoreTargetId(b.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition border border-amber-200"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
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

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTargetId)}
        onClose={() => setRestoreTargetId(null)}
        onConfirm={handleRestore}
        title="Restore Database from Snapshot"
        message="Warning: Restoring will replace the active database with this snapshot. Any newer records created after this snapshot will be overwritten. Proceed?"
        confirmText="Confirm Restore"
        isDanger={true}
        isLoading={restoring}
      />
    </div>
  );
}
