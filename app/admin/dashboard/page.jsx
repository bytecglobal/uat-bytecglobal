"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  Mail,
  UserCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { DailyTrafficChart, DeviceDonut } from "@/components/admin/charts";

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch(`/api/admin/dashboard?range=${dateRange}`)
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
    fetchDashboardData();
  }, [dateRange]);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Top Welcome & Date Filter Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Executive Overview
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time analytics, client pipelines, and corporate website performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="inline-flex rounded-xl bg-white p-1 border border-gray-200 shadow-sm text-xs font-semibold">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateRange(tab.id)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  dateRange === tab.id
                    ? "bg-[#29251b] text-[#f5c518] shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 transition shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI STATISTICS CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Visitors */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Total Visitors</span>
            <Users size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.totalVisitors ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span className="text-emerald-700 font-semibold">{kpis.uniqueVisitors ?? 0}</span> unique
          </div>
        </div>

        {/* Page Views */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Page Views</span>
            <Eye size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.totalPageViews ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span className="font-semibold text-gray-700">{kpis.returningVisitors ?? 0}</span> returning
          </div>
        </div>

        {/* Contact Inquiries */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Inquiries</span>
            <Mail size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.totalInquiries ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <Link href="/admin/contacts" className="text-[#806000] hover:underline font-semibold">
              View inbox &rarr;
            </Link>
          </div>
        </div>

        {/* Active Leads */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Active Leads</span>
            <UserCheck size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.activeLeads ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span className="text-emerald-700 font-semibold">{kpis.newLeads ?? 0}</span> in pipeline
          </div>
        </div>

        {/* Meetings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Meetings</span>
            <Calendar size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.meetingsScheduled ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span className="text-amber-800 font-semibold">{kpis.meetingClicks ?? 0}</span> CTA clicks
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Conversion</span>
            <TrendingUp size={16} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-display">
            {kpis.conversionRate ?? "0%"}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span className="text-gray-700 font-semibold">{kpis.whatsappClicks ?? 0}</span> WA chats
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Daily Traffic Timeline */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Traffic &amp; Engagement Activity</h2>
              <p className="text-xs text-gray-500">Verified visits and page views across selected period</p>
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-[#806000] hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <DailyTrafficChart data={data?.dailyTimeline || []} />
        </div>

        {/* Device Breakdown & Traffic Sources */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Device Distribution</h2>
            <p className="text-xs text-gray-500 mb-4">Breakdown by device category</p>
            <DeviceDonut devices={data?.devices || {}} />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-900">Traffic Sources</span>
              <span className="text-[11px] text-gray-400">Visitor Acquisition</span>
            </div>
            <div className="space-y-2">
              {(data?.trafficSources || []).slice(0, 3).map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{s.name}</span>
                    <span className="font-semibold text-gray-900">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      style={{ width: `${s.percentage}%` }}
                      className="h-full rounded-full bg-[#f5c518]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT INQUIRIES & RECENT LEADS DUAL PANEL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Inquiries */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Contact Inquiries</h2>
            <Link href="/admin/contacts" className="text-xs font-semibold text-[#806000] hover:underline">
              View All ({data?.recentInquiries?.length || 0})
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(!data?.recentInquiries || data.recentInquiries.length === 0) ? (
              <p className="py-6 text-center text-xs text-gray-400">No contact inquiries recorded yet.</p>
            ) : (
              data.recentInquiries.slice(0, 4).map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.companyName || c.email} · <span className="text-gray-700">{c.service}</span></div>
                    <p className="text-xs text-gray-600 line-clamp-1 italic mt-0.5">&ldquo;{c.message}&rdquo;</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      c.status === "new"
                        ? "bg-amber-100 text-amber-800"
                        : c.status === "qualified"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings & Client Milestones */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Upcoming Meetings</h2>
            <Link href="/admin/meetings" className="text-xs font-semibold text-[#806000] hover:underline">
              Manage Meetings
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(!data?.upcomingMeetings || data.upcomingMeetings.length === 0) ? (
              <p className="py-6 text-center text-xs text-gray-400">No upcoming meetings scheduled.</p>
            ) : (
              data.upcomingMeetings.slice(0, 4).map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-gray-900">{m.title}</div>
                    <div className="text-xs text-gray-500">
                      With <span className="font-semibold text-gray-700">{m.clientName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#806000] flex items-center gap-1 justify-end">
                      <Clock size={12} />
                      <span>{m.date} at {m.time}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 capitalize">{m.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECENT PROJECTS & AUDIT LOG ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Client Projects */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Active Client Projects</h2>
            <Link href="/admin/projects" className="text-xs font-semibold text-[#806000] hover:underline">
              All Projects &rarr;
            </Link>
          </div>
          <div className="space-y-4">
            {(data?.recentProjects || []).map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-100 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">{p.title}</span>
                  <span className="text-xs font-mono font-semibold text-gray-500">{p.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${p.progress}%` }}
                    className="h-full rounded-full bg-[#f5c518]"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Client: {p.clientName}</span>
                  <span className="capitalize">{p.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Activity Logs */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Admin Activities</h2>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-[#806000] hover:underline">
              Full Audit Trail
            </Link>
          </div>
          <div className="divide-y divide-gray-100 text-xs">
            {(data?.recentActivities || []).slice(0, 5).map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between">
                <div>
                  <span className="font-bold text-gray-800">{act.action}</span>
                  <p className="text-gray-500 text-[11px] mt-0.5">{act.details}</p>
                </div>
                <div className="text-right text-[10px] text-gray-400 whitespace-nowrap">
                  <div>{act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ""}</div>
                  <span className="text-emerald-700 font-mono font-medium">{act.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
