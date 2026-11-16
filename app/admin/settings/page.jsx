"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, ShieldCheck, Mail, MessageSquare, Compass, Globe, Lock } from "lucide-react";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    general: {
      siteName: "BytecGlobal",
      supportEmail: "bytecglobal@gmail.com",
      timezone: "Asia/Kolkata",
      dateFormat: "YYYY-MM-DD",
      maintenanceMode: false,
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionExpiryHours: 24,
      enforceStrongPasswords: true,
    },
    integrations: {
      resend: { configured: false, status: "Not Configured" },
      whatsapp: { configured: false, status: "Not Configured" },
      calendly: { configured: true, status: "Connected" },
    },
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  const fetchSettings = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSavedMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: settings.general,
          security: settings.security,
        }),
      });
      if (res.ok) {
        setSavedMessage("System configuration saved successfully.");
        setTimeout(() => setSavedMessage(""), 4000);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            System &amp; Infrastructure Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Global administrative configurations, security lockout rules, and external integration health.
          </p>
        </div>

        <button
          type="submit"
          form="settings-form"
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-5 py-2 text-xs font-bold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* External Integrations Health Status */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
          External Infrastructure &amp; Vendor Connectivity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Resend Email */}
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Mail size={15} className="text-[#806000]" />
                <span>Resend Email API</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  settings.integrations?.resend?.configured
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {settings.integrations?.resend?.configured ? "Connected" : "Notice"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {settings.integrations?.resend?.status}
            </p>
          </div>

          {/* WhatsApp Direct */}
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <MessageSquare size={15} className="text-emerald-600" />
                <span>WhatsApp Business</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  settings.integrations?.whatsapp?.configured
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {settings.integrations?.whatsapp?.configured ? "Active" : "Unset"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {settings.integrations?.whatsapp?.status}
            </p>
          </div>

          {/* Calendly Booking */}
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Compass size={15} className="text-[#806000]" />
                <span>Calendly Scheduler</span>
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {settings.integrations?.calendly?.status}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Globe size={16} className="text-[#806000]" />
            <span>General Platform Parameters</span>
          </h2>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Company / Brand Name</label>
            <input
              type="text"
              value={settings.general?.siteName || "BytecGlobal"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, siteName: e.target.value },
                })
              }
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Inquiry Notification Recipient Email</label>
            <input
              type="email"
              value={settings.general?.supportEmail || "bytecglobal@gmail.com"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, supportEmail: e.target.value },
                })
              }
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Timezone</label>
              <select
                value={settings.general?.timezone || "Asia/Kolkata"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="UTC">UTC Universal</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Date Format</label>
              <select
                value={settings.general?.dateFormat || "YYYY-MM-DD"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, dateFormat: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Policy Settings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Lock size={16} className="text-[#806000]" />
            <span>Security &amp; Rate-Limiting Policy</span>
          </h2>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Maximum Failed Login Attempts before Lockout
            </label>
            <input
              type="number"
              min={3}
              max={10}
              value={settings.security?.maxLoginAttempts || 5}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, maxLoginAttempts: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Account Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.security?.lockoutDurationMinutes || 15}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, lockoutDurationMinutes: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Admin Session Inactivity Expiry (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={settings.security?.sessionExpiryHours || 24}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, sessionExpiryHours: Number(e.target.value) },
                })
              }
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-800 text-[11px] leading-relaxed">
            <ShieldCheck size={14} className="inline mr-1" />
            <span>All sessions are signed server-side with JWT and stored in HTTP-only, secure, SameSite cookies.</span>
          </div>
        </div>
      </form>
    </div>
  );
}
