"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Save, CheckCircle2, MousePointerClick, ShieldCheck, Eye } from "lucide-react";

export default function WhatsAppManagementPage() {
  const [settings, setSettings] = useState({
    phoneNumber: "",
    defaultMessage: "Hello BytecGlobal team, I would like to inquire about your software and engineering services.",
    enabled: true,
    position: "bottom-right",
    clickCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  const fetchSettings = () => {
    setLoading(true);
    fetch("/api/admin/whatsapp")
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
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMessage("WhatsApp settings saved and live on website!");
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
            WhatsApp Integration &amp; Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure direct instant chat, verified button click metrics, pre-filled greeting text, and placement.
          </p>
        </div>

        <button
          type="submit"
          form="whatsapp-form"
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-5 py-2 text-xs font-bold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Save size={14} />
          <span>Save Settings</span>
        </button>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Verified Analytics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Total WhatsApp Clicks</span>
            <MousePointerClick size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-gray-900 font-display">
            {settings.clickCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Verified client click beacons on floating widget
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Button Visibility</span>
            <Eye size={18} className="text-[#806000]" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">
            {settings.enabled ? "Active on All Pages" : "Hidden"}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Controlled globally via CMS</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Target Phone Number</span>
            <MessageSquare size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-sm font-bold text-gray-900">
            {settings.phoneNumber ? `+${settings.phoneNumber}` : "Not Configured"}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Formatted with international dial code</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <form
          id="whatsapp-form"
          onSubmit={handleSave}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-base font-bold text-gray-900">Configuration Parameters</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="rounded text-[#f5c518] focus:ring-[#f5c518]"
              />
              <span className="font-semibold text-gray-800">Floating Button Active</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              WhatsApp Business Number (digits only, e.g. 919876543210)
            </label>
            <input
              type="text"
              value={settings.phoneNumber}
              onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="e.g. 919876543210"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Default Pre-filled Message</label>
            <textarea
              rows={4}
              value={settings.defaultMessage}
              onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Screen Position</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings({ ...settings, position: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            >
              <option value="bottom-right">Bottom Right Corner (Standard)</option>
              <option value="bottom-left">Bottom Left Corner</option>
            </select>
          </div>
        </form>

        {/* Live Visual Demonstration */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              Floating Widget Visual Preview
            </h2>
            <p className="text-gray-500 mt-2 leading-relaxed">
              The floating button uses BytecGlobal&apos;s custom yellow accent (<code>#f5c518</code>) and pulsing ring animation on public pages.
            </p>

            <div className="relative mt-6 h-48 rounded-xl bg-[#f2f3f7] border border-gray-200 flex items-center justify-center overflow-hidden">
              <span className="text-xs text-gray-400 font-mono">Public Website Viewport Simulation</span>

              {settings.enabled && (
                <div
                  className={`absolute ${
                    settings.position === "bottom-left" ? "bottom-4 left-4" : "bottom-4 right-4"
                  }`}
                >
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#f5c518] text-[#1c1a16] shadow-lg">
                    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
                      <path
                        d="m6.5 25.6 1.2-4.4a11 11 0 1 1 4.1 4l-5.3 1.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 10.4c.3-.2.6-.1.7.2l1.1 2.4c.1.3.1.5-.1.7l-.8 1c.7 1.7 2.1 3 3.7 3.8l1.1-.9c.2-.2.4-.2.7-.1l2.3 1.1c.4.2.4.5.3.8-.3 1.4-1.4 2-2.6 1.8-4.5-.7-8.6-4.7-8.8-8.1 0-1.2 1-2.4 2.4-2.7Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-600 leading-relaxed">
            <strong>Important Policy:</strong> As per security guidelines, WhatsApp clicks are recorded as engagement events, but individual chat messages are handled end-to-end securely on WhatsApp&apos;s external infrastructure.
          </div>
        </div>
      </div>
    </div>
  );
}
