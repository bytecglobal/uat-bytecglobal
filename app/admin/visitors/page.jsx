"use client";

import { useState, useEffect } from "react";
import { Users2, Search, Download, Filter, Globe, Monitor, Smartphone, Clock, Eye, Layers } from "lucide-react";
import { Modal } from "@/components/admin/modal";

export default function VisitorsManagementPage() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const fetchVisitors = () => {
    setLoading(true);
    const query = new URLSearchParams({
      search,
      device: deviceFilter,
      source: sourceFilter,
    });

    fetch(`/api/admin/visitors?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVisitors(data.visitors || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVisitors();
  }, [search, deviceFilter, sourceFilter]);

  const handleExportCsv = () => {
    const query = new URLSearchParams({
      search,
      device: deviceFilter,
      source: sourceFilter,
      format: "csv",
    });
    window.location.href = `/api/admin/visitors?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Anonymous Visitors
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real privacy-compliant tracking of website sessions, landing pages, and traffic referrals.
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
            placeholder="Search by Visitor ID, page, or browser..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        {/* Device Filter */}
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Devices</option>
          <option value="Desktop">Desktop</option>
          <option value="Mobile">Mobile</option>
          <option value="Tablet">Tablet</option>
        </select>

        {/* Traffic Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Sources</option>
          <option value="Direct">Direct</option>
          <option value="Organic Search">Organic Search</option>
          <option value="Social Media">Social Media</option>
          <option value="Referral">Referral</option>
        </select>
      </div>

      {/* Visitors Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/60 font-mono font-medium text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Visitor ID</th>
                <th className="py-3 px-4">Device &amp; OS</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Traffic Source</th>
                <th className="py-3 px-4">Landing Page</th>
                <th className="py-3 px-4">Visits</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading visitors database...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No matching visitor sessions recorded yet.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.visitorId} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      {v.visitorId.slice(0, 16)}...
                      {v.totalVisits > 1 ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 font-sans font-bold">
                          Returning
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-sans font-bold">
                          New
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex items-center gap-1.5">
                        {v.deviceType === "Mobile" ? <Smartphone size={13} /> : <Monitor size={13} />}
                        <span>{v.deviceType} ({v.os})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{v.browser}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {v.trafficSource}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 max-w-[140px] truncate" title={v.landingPage}>
                      {v.landingPage}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">{v.totalVisits}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(v.lastVisit).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedVisitor(v)}
                        className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-[#29251b] hover:text-[#f5c518] transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Details Modal */}
      {selectedVisitor && (
        <Modal
          isOpen={Boolean(selectedVisitor)}
          onClose={() => setSelectedVisitor(null)}
          title={`Visitor Dossier: ${selectedVisitor.visitorId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">First Visit</span>
                <p className="font-semibold text-gray-800">{new Date(selectedVisitor.firstVisit).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Last Visit</span>
                <p className="font-semibold text-gray-800">{new Date(selectedVisitor.lastVisit).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Device / Browser</span>
                <p className="font-semibold text-gray-800">{selectedVisitor.deviceType} · {selectedVisitor.browser} ({selectedVisitor.os})</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Referral Source</span>
                <p className="font-semibold text-gray-800">{selectedVisitor.trafficSource}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Browsing Journey &amp; Pages Visited</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border border-gray-100 p-2 bg-white">
                {(selectedVisitor.pagesVisited || []).map((page, idx) => (
                  <div key={idx} className="flex items-center gap-2 font-mono text-gray-600">
                    <span className="text-gray-300">#{idx + 1}</span>
                    <span>{page}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-amber-800 text-[11px] leading-relaxed">
              <strong>Privacy Notice:</strong> This visitor is tracked anonymously in compliance with corporate privacy regulations. No Personally Identifiable Information (PII) is recorded without explicit voluntary form submission.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
