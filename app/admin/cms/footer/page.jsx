"use client";

import { useState, useEffect } from "react";
import { Footprints, Lock, CheckCircle2, Save, Eye, ArrowUpRight } from "lucide-react";

export default function FooterCMSPage() {
  const [footer, setFooter] = useState({
    brandDescription: "Software, AI and cloud engineering for ambitious businesses.",
    contactEmail: "bytecglobal@gmail.com",
    meetingUrl: "https://calendly.com/team-bytecglobal/30min",
    meetingLabel: "Book a Meeting",
    copyrightText: `© ${new Date().getFullYear()} BytecGlobal. All rights reserved.`,
    adminLoginLink: {
      label: "Admin Login",
      url: "/admin/login",
      enabled: true,
      showLockIcon: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/cms?section=footer")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.footer) {
          setFooter((prev) => ({
            ...prev,
            ...data.footer,
            adminLoginLink: {
              ...prev.adminLoginLink,
              ...(data.footer.adminLoginLink || {}),
            },
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (publish = false) => {
    setSavedMessage("");
    try {
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "footer", data: footer, publish }),
      });
      setSavedMessage(publish ? "Footer changes published live to website!" : "Draft footer saved.");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Footer Management &amp; Admin Link
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure the 4-column corporate footer, branding copy, meeting button, and public Admin Login entry point.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition shadow-xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="rounded-full bg-[#29251b] px-5 py-2 text-xs font-bold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
          >
            Publish Footer Live
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1, 2, 3 SETTINGS */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            General Footer &amp; Contact Information
          </h2>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Brand Description Blurb</label>
            <textarea
              rows={3}
              value={footer.brandDescription}
              onChange={(e) => setFooter({ ...footer, brandDescription: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Corporate Contact Email</label>
              <input
                type="email"
                value={footer.contactEmail}
                onChange={(e) => setFooter({ ...footer, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meeting Booking URL</label>
              <input
                type="text"
                value={footer.meetingUrl}
                onChange={(e) => setFooter({ ...footer, meetingUrl: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Copyright Statement</label>
            <input
              type="text"
              value={footer.copyrightText}
              onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>
        </div>

        {/* COLUMN 4 & ADMIN LOGIN LINK SETTINGS */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Lock size={16} className="text-[#806000]" />
                <span>Footer Admin Login Link</span>
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footer.adminLoginLink?.enabled !== false}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      adminLoginLink: { ...footer.adminLoginLink, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-[#f5c518] focus:ring-[#f5c518]"
                />
                <span className="font-bold text-gray-800">Show in Footer</span>
              </label>
            </div>

            <p className="text-gray-600 leading-relaxed text-[11px]">
              As specified in PART 14 (L), this link appears directly beneath the Book a Meeting button in the GET IN TOUCH column of the dark footer.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Link Display Label</label>
                <input
                  type="text"
                  value={footer.adminLoginLink?.label || "Admin Login"}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      adminLoginLink: { ...footer.adminLoginLink, label: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Navigation Route</label>
                <input
                  type="text"
                  value={footer.adminLoginLink?.url || "/admin/login"}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      adminLoginLink: { ...footer.adminLoginLink, url: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-2 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={footer.adminLoginLink?.showLockIcon !== false}
                onChange={(e) =>
                  setFooter({
                    ...footer,
                    adminLoginLink: { ...footer.adminLoginLink, showLockIcon: e.target.checked },
                  })
                }
                className="rounded text-[#f5c518] focus:ring-[#f5c518]"
              />
              <span className="text-gray-700">Display subtle padlock icon next to link</span>
            </label>

            {/* Visual Preview in Dark Footer Theme */}
            <div className="rounded-xl bg-[#29251b] p-4 text-white text-xs space-y-2 mt-4 border border-[#3b362c]">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Live Visual Preview</span>
              <div className="text-[11px] text-gray-400 font-mono uppercase tracking-wider font-semibold">GET IN TOUCH</div>
              <div className="text-xs text-gray-300">{footer.contactEmail}</div>
              <div className="inline-block rounded-full bg-[#f5c518] text-[#29251b] font-bold px-4 py-1.5 text-xs">
                {footer.meetingLabel || "Book a Meeting"}
              </div>
              {footer.adminLoginLink?.enabled !== false && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#c6bea8] hover:text-[#f5c518] cursor-pointer">
                    {footer.adminLoginLink?.showLockIcon !== false && <Lock size={12} />}
                    <span>{footer.adminLoginLink?.label || "Admin Login"}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
