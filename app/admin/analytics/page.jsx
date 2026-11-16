"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Compass, Globe, Smartphone, Monitor, Eye, MousePointerClick, RefreshCw } from "lucide-react";
import { DailyTrafficChart, DeviceDonut } from "@/components/admin/charts";

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Traffic &amp; Conversion Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real visitor activity, session trends, conversion funnels, and button engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 border border-gray-200 shadow-xs text-xs font-semibold">
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRange(t.id)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  range === t.id
                    ? "bg-[#29251b] text-[#f5c518] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 transition shadow-xs"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Total Sessions</span>
            <Eye size={18} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-3xl font-black text-gray-900 font-display">
            {kpis.totalPageViews || 0}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Across <span className="font-semibold text-gray-800">{kpis.uniqueVisitors || 0}</span> unique devices
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">WhatsApp CTA Clicks</span>
            <MousePointerClick size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-gray-900 font-display">
            {kpis.whatsappClicks || 0}
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-medium">
            Floating action button
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Book a Meeting Clicks</span>
            <Compass size={18} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-3xl font-black text-gray-900 font-display">
            {kpis.meetingClicks || 0}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Calendly discovery calls
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Inquiry Submissions</span>
            <TrendingUp size={18} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-3xl font-black text-gray-900 font-display">
            {kpis.totalInquiries || 0}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Conversion rate: <span className="font-semibold text-gray-900">{kpis.conversionRate || "0%"}</span>
          </div>
        </div>
      </div>

      {/* Main Traffic Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 mb-1">Traffic Velocity Timeline</h2>
        <p className="text-xs text-gray-500 mb-4">Daily page views vs unique visitor trajectory</p>
        <DailyTrafficChart data={data?.dailyTimeline || []} />
      </div>

      {/* Grid: Popular Pages & Technology / Source Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Popular Pages */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-gray-900 mb-1">Most Visited Pages</h2>
          <p className="text-xs text-gray-500 mb-4">Top URL paths by verified client views</p>
          <div className="divide-y divide-gray-100">
            {(!data?.popularPages || data.popularPages.length === 0) ? (
              <p className="py-6 text-center text-xs text-gray-400">No page views recorded yet.</p>
            ) : (
              data.popularPages.map((p, idx) => (
                <div key={p.path} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-gray-400 w-5">0{idx + 1}</span>
                    <span className="font-mono font-semibold text-gray-800">{p.path}</span>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-bold text-gray-700">
                    {p.views} views
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Traffic Sources & Browsers */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Traffic Channels</h2>
            <p className="text-xs text-gray-500 mb-3">Origin referrer classification</p>
            <div className="space-y-2">
              {(data?.trafficSources || []).map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <span className="font-bold text-gray-900">{s.count} visits ({s.percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div style={{ width: `${s.percentage}%` }} className="h-full rounded-full bg-[#f5c518]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 font-mono">
              Browser Share
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(data?.browsers || {}).map(([bName, bCount]) => (
                <div key={bName} className="flex justify-between rounded-lg bg-gray-50 p-2">
                  <span className="text-gray-600">{bName}</span>
                  <span className="font-bold text-gray-900">{bCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
