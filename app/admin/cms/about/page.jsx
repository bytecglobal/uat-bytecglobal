"use client";

import { useState, useEffect } from "react";
import { Info, CheckCircle2, Save, Eye, ArrowUpRight } from "lucide-react";

export default function AboutCMSPage() {
  const [about, setAbout] = useState({
    heading: "Engineering Digital Excellence for Forward-Thinking Enterprises",
    subheading: "Custom solutions crafted around how your business really operates.",
    content: "BytecGlobal is a premier technology partner specializing in enterprise custom software, cloud architecture, and artificial intelligence solutions. We replace manual friction with seamless, reliable software.",
    visibility: true,
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/cms?section=about")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.about) {
          setAbout((prev) => ({ ...prev, ...data.about }));
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
        body: JSON.stringify({ section: "about", data: about, publish }),
      });
      setSavedMessage(publish ? "About section published live!" : "Draft saved successfully.");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            About Section CMS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage company philosophy, mission narratives, and the public /about page copy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <Eye size={14} />
            <span>View Public /about</span>
          </a>
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
            Publish Live
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs max-w-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-base font-bold text-gray-900">Corporate Identity &amp; Positioning</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={about.visibility !== false}
              onChange={(e) => setAbout({ ...about, visibility: e.target.checked })}
              className="rounded text-[#f5c518] focus:ring-[#f5c518]"
            />
            <span className="font-semibold text-gray-700">Section Enabled</span>
          </label>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Main Heading</label>
          <input
            type="text"
            value={about.heading}
            onChange={(e) => setAbout({ ...about, heading: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Subheading / Value Promise</label>
          <input
            type="text"
            value={about.subheading}
            onChange={(e) => setAbout({ ...about, subheading: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">About Company Story &amp; Ethos</label>
          <textarea
            rows={6}
            value={about.content}
            onChange={(e) => setAbout({ ...about, content: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>
      </div>
    </div>
  );
}
