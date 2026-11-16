"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, ArrowRight, ShieldAlert, Mail, UserCheck, Calendar, Zap, AlertTriangle } from "lucide-react";

const CATEGORY_ICONS = {
  inquiry: Mail,
  lead: UserCheck,
  meeting: Calendar,
  email: Mail,
  automation: Zap,
  security: ShieldAlert,
  project: Bell,
};

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = () => {
    setLoading(true);
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
    } catch {}
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch {}
  };

  const handleDeleteAll = async () => {
    try {
      await fetch("/api/admin/notifications?id=all", { method: "DELETE" });
      fetchNotifications();
    } catch {}
  };

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Notification Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            System alarms, client inquiry alerts, automated workflow triggers, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
            >
              <CheckCheck size={14} className="text-[#806000]" />
              <span>Mark All as Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition shadow-xs"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-w-4xl divide-y divide-gray-100">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No notifications found.</div>
        ) : (
          filtered.map((n) => {
            const Icon = CATEGORY_ICONS[n.category] || Bell;
            return (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-4 transition hover:bg-gray-50/70 ${
                  !n.read ? "bg-amber-50/30" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    !n.read ? "bg-[#f5c518] text-[#1c1a16]" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={17} />
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                    <span className="font-mono text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1 leading-relaxed">{n.message}</p>

                  <div className="mt-3 flex items-center gap-3">
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => handleMarkSingleRead(n.id)}
                        className="inline-flex items-center gap-1 font-bold text-[#806000] hover:underline text-[11px]"
                      >
                        <span>View Resource</span>
                        <ArrowRight size={11} />
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkSingleRead(n.id)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-700"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
