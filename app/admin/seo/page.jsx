"use client";

import { useState, useEffect } from "react";
import { Search, Globe, Save, CheckCircle2, Eye, ShieldCheck, FileText } from "lucide-react";

const PAGES = [
  { path: "/", label: "Homepage" },
  { path: "/about", label: "About Page" },
  { path: "/services", label: "Services Page" },
  { path: "/solutions", label: "Solutions Page" },
  { path: "/projects", label: "Projects & Portfolio" },
  { path: "/technologies", label: "Technologies Page" },
  { path: "/contact", label: "Contact Us Page" },
];

export default function SeoManagementPage() {
  const [selectedPath, setSelectedPath] = useState("/");
  const [seoData, setSeoData] = useState({ global: {}, pages: {} });
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  const [currentPageSeo, setCurrentPageSeo] = useState({
    title: "",
    description: "",
  });

  const [globalSettings, setGlobalSettings] = useState({
    siteName: "BytecGlobal",
    defaultTitle: "BytecGlobal | Custom Software, AI & Cloud Engineering",
    defaultDescription: "BytecGlobal builds enterprise custom software, web platforms, mobile apps, and AI solutions tailored to operational business needs.",
    canonicalBase: "https://bytecglobal.com",
    robots: "index, follow",
    ogImage: "/bytecglobal-banner.jpg",
  });

  useEffect(() => {
    fetch("/api/admin/seo")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.seo) {
          setSeoData(data.seo);
          if (data.seo.global) setGlobalSettings((prev) => ({ ...prev, ...data.seo.global }));
          if (data.seo.pages?.[selectedPath]) {
            setCurrentPageSeo(data.seo.pages[selectedPath]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (seoData.pages?.[selectedPath]) {
      setCurrentPageSeo(seoData.pages[selectedPath]);
    } else {
      setCurrentPageSeo({
        title: `${PAGES.find((p) => p.path === selectedPath)?.label} | BytecGlobal`,
        description: globalSettings.defaultDescription,
      });
    }
  }, [selectedPath, seoData]);

  const handleSavePageSeo = async (e) => {
    e.preventDefault();
    setSavedMessage("");
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath: selectedPath,
          pageSeo: currentPageSeo,
          global: globalSettings,
        }),
      });
      if (res.ok) {
        setSavedMessage(`SEO settings saved for ${selectedPath}!`);
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
            Search Engine Optimisation (SEO)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Meta tags, Open Graph previews, Google indexing directives, XML sitemap, and robots.txt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <FileText size={13} />
            <span>sitemap.xml</span>
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <FileText size={13} />
            <span>robots.txt</span>
          </a>
        </div>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Page Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {PAGES.map((page) => (
          <button
            key={page.path}
            type="button"
            onClick={() => setSelectedPath(page.path)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selectedPath === page.path
                ? "bg-[#29251b] text-[#f5c518] shadow-xs"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Meta Editor Form */}
        <form onSubmit={handleSavePageSeo} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Target Metadata: {selectedPath}
          </h2>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-gray-700">Page Meta Title *</label>
              <span className={`font-mono text-[10px] ${currentPageSeo.title.length > 60 ? "text-amber-700" : "text-gray-400"}`}>
                {currentPageSeo.title.length}/60 chars
              </span>
            </div>
            <input
              type="text"
              required
              value={currentPageSeo.title}
              onChange={(e) => setCurrentPageSeo({ ...currentPageSeo, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-gray-700">Meta Description *</label>
              <span className={`font-mono text-[10px] ${currentPageSeo.description.length > 160 ? "text-amber-700" : "text-gray-400"}`}>
                {currentPageSeo.description.length}/160 chars
              </span>
            </div>
            <textarea
              rows={4}
              required
              value={currentPageSeo.description}
              onChange={(e) => setCurrentPageSeo({ ...currentPageSeo, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-[#f5c518]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Canonical Base URL</label>
              <input
                type="text"
                value={globalSettings.canonicalBase}
                onChange={(e) => setGlobalSettings({ ...globalSettings, canonicalBase: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Robots Tag</label>
              <select
                value={globalSettings.robots}
                onChange={(e) => setGlobalSettings({ ...globalSettings, robots: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
              >
                <option value="index, follow">index, follow (Recommended)</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-full bg-[#29251b] px-5 py-2.5 text-xs font-bold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
            >
              Update SEO Configuration
            </button>
          </div>
        </form>

        {/* Live SERP & Social Preview */}
        <div className="space-y-6">
          {/* Google Search Result Preview */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Google Search Result Snippet
            </span>
            <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-700">
                <Globe size={13} className="text-[#806000]" />
                <span className="font-mono text-[11px] text-gray-500">
                  {globalSettings.canonicalBase}{selectedPath === "/" ? "" : selectedPath}
                </span>
              </div>
              <h3 className="text-base text-[#1a0dab] hover:underline cursor-pointer font-medium font-sans">
                {currentPageSeo.title || "Page Title"}
              </h3>
              <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {currentPageSeo.description || "Page meta description will appear here in search engine rankings..."}
              </p>
            </div>
          </div>

          {/* Open Graph Social Card Preview */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Open Graph (LinkedIn &amp; Twitter) Preview
            </span>
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              <div className="h-32 bg-[#29251b] flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 rounded-lg bg-[#f5c518] text-[#29251b] font-black text-sm leading-8">
                    B
                  </div>
                  <div className="text-xs font-bold text-[#f5c518] mt-1 font-display">BytecGlobal</div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 text-xs border-t border-gray-100">
                <span className="font-mono text-[10px] text-gray-400 uppercase">bytecglobal.com</span>
                <div className="font-bold text-gray-900 truncate mt-0.5">{currentPageSeo.title}</div>
                <div className="text-gray-500 line-clamp-1 text-[11px] mt-0.5">{currentPageSeo.description}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
