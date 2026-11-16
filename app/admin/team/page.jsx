"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users2, Shield, Mail, Clock, ArrowRight, UserCheck } from "lucide-react";

export default function TeamManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Staff &amp; Internal Team Roster
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Departmental overview of active administrators, editors, and operational managers.
          </p>
        </div>

        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Shield size={14} />
          <span>Manage Permissions</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading team...</div>
        ) : users.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No team members found.</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5c518] text-[#1c1a16] font-bold text-base shadow-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{u.name}</h3>
                    <span className="font-mono text-[11px] text-gray-400">{u.email}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Privilege:</span>
                    <span className="font-mono font-bold text-[#806000]">{u.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold capitalize ${u.status === "active" ? "text-emerald-700" : "text-gray-500"}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Active:</span>
                    <span className="font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#806000] hover:underline"
                >
                  <span>Edit Profile &amp; Role</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
