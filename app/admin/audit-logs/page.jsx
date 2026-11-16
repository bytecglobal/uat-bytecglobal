"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Download, Search, Filter, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const fetchLogs = () => {
    setLoading(true);
    const query = new URLSearchParams({
      search,
      module: moduleFilter,
      result: resultFilter,
    });

    fetch(`/api/admin/audit-logs?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [search, moduleFilter, resultFilter]);

  const handleExportCsv = () => {
    const query = new URLSearchParams({
      search,
      module: moduleFilter,
      result: resultFilter,
      format: "csv",
    });
    window.location.href = `/api/admin/audit-logs?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Security &amp; Audit Logs
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tamper-evident audit trail capturing administrative modifications, authentication attempts, and system actions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, admin email, IP address, or details..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Modules</option>
          <option value="AUTH">Authentication (AUTH)</option>
          <option value="CMS">Content (CMS)</option>
          <option value="CONTACTS">Contacts</option>
          <option value="LEADS">Leads</option>
          <option value="USERS">Users</option>
          <option value="BACKUPS">Backups</option>
          <option value="SETTINGS">Settings</option>
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Outcomes</option>
          <option value="success">Success</option>
          <option value="failure">Failure / Locked</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No matching audit logs found.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono text-[11px]">{l.action}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-700">
                        {l.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">{l.adminEmail}</td>
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">{l.ip}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          l.result === "success"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.result === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {l.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
