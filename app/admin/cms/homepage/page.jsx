"use client";

import { useState, useEffect } from "react";
import { LayoutTemplate, Sparkles, CheckCircle2, Save, Eye, ArrowUpRight } from "lucide-react";

export default function HomepageCMSPage() {
  const [homepage, setHomepage] = useState({
    categoryText: "Software · AI · Cloud · Data",
    mainHeading: "Your digital transformation",
    highlightedHeading: "partner.",
    description: "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools, built around how your business really works.",
    primaryButtonText: "Let's talk",
    primaryButtonUrl: "/start-project",
    secondaryButtonText: "See our work",
    secondaryButtonUrl: "/projects",
    tags: ["100% custom-built", "Web, mobile, AI & cloud under one roof"],
  });

  const [heroAnimation, setHeroAnimation] = useState({
    enabled: true,
    particleCount: 160,
    particleSize: 3,
    animationSpeed: 1,
    behavior: "interactive-orbit",
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/cms?section=homepage")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.homepage) setHomepage((prev) => ({ ...prev, ...data.homepage }));
          if (data.heroAnimation) setHeroAnimation((prev) => ({ ...prev, ...data.heroAnimation }));
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
        body: JSON.stringify({ section: "homepage", data: homepage, publish }),
      });
      await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "heroAnimation", data: heroAnimation, publish }),
      });
      setSavedMessage(publish ? "Published live to BytecGlobal homepage!" : "Draft changes saved successfully.");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Homepage Hero &amp; Animation CMS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage the hero headline, call-to-action buttons, value propositions, and 3D particle sphere.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <Eye size={14} />
            <span>Preview Homepage</span>
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

      {/* Main Hero Copy Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Hero Typography &amp; Headlines
          </h2>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Small Category Eyebrow</label>
            <input
              type="text"
              value={homepage.categoryText}
              onChange={(e) => setHomepage({ ...homepage, categoryText: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Main Heading (Primary Line)</label>
            <input
              type="text"
              value={homepage.mainHeading}
              onChange={(e) => setHomepage({ ...homepage, mainHeading: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Highlighted Accent Text (Yellow)</label>
            <input
              type="text"
              value={homepage.highlightedHeading}
              onChange={(e) => setHomepage({ ...homepage, highlightedHeading: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold text-[#806000] focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Lead Narrative Description</label>
            <textarea
              rows={4}
              value={homepage.description}
              onChange={(e) => setHomepage({ ...homepage, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>
        </div>

        {/* Buttons & Feature Tags */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              Call to Action Buttons
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Primary Button Label</label>
                <input
                  type="text"
                  value={homepage.primaryButtonText}
                  onChange={(e) => setHomepage({ ...homepage, primaryButtonText: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Primary URL</label>
                <input
                  type="text"
                  value={homepage.primaryButtonUrl}
                  onChange={(e) => setHomepage({ ...homepage, primaryButtonUrl: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Secondary Button Label</label>
                <input
                  type="text"
                  value={homepage.secondaryButtonText}
                  onChange={(e) => setHomepage({ ...homepage, secondaryButtonText: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Secondary URL</label>
                <input
                  type="text"
                  value={homepage.secondaryButtonUrl}
                  onChange={(e) => setHomepage({ ...homepage, secondaryButtonUrl: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
          </div>

          {/* 3D Hero Particle Animation Settings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-[#806000]" />
                <span>Hero Particle Sphere Configuration</span>
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heroAnimation.enabled}
                  onChange={(e) => setHeroAnimation({ ...heroAnimation, enabled: e.target.checked })}
                  className="rounded text-[#f5c518] focus:ring-[#f5c518]"
                />
                <span className="font-semibold text-gray-700">Animation Active</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Particle Count</label>
                <input
                  type="number"
                  value={heroAnimation.particleCount}
                  onChange={(e) => setHeroAnimation({ ...heroAnimation, particleCount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Particle Size</label>
                <input
                  type="number"
                  value={heroAnimation.particleSize}
                  onChange={(e) => setHeroAnimation({ ...heroAnimation, particleSize: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Speed Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={heroAnimation.animationSpeed}
                  onChange={(e) => setHeroAnimation({ ...heroAnimation, animationSpeed: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
