"use client";

import { useState } from "react";

export function DailyTrafficChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400">
        No traffic events recorded yet.
      </div>
    );
  }

  const height = 180;
  const width = 600;
  const padding = 24;

  const maxVal = Math.max(...data.map((d) => Math.max(d.views || 0, d.visitors || 0)), 10);

  // Generate SVG path points
  const pointsViews = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.views / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pointsVisitors = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.visitors / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  });

  const areaViews = `${padding},${height - padding} ${pointsViews.join(" ")} ${width - padding},${height - padding}`;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f5c518]" /> Page Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#29251b]" /> Unique Visitors
          </span>
        </div>
        {hovered && (
          <div className="text-xs font-semibold text-gray-700">
            {hovered.date}: <span className="text-[#9a7300]">{hovered.views} views</span> ·{" "}
            <span>{hovered.visitors} visitors</span>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible">
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c518" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f5c518" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <polygon points={areaViews} fill="url(#viewsGrad)" />

        {/* Line for Views */}
        <polyline
          fill="none"
          stroke="#f5c518"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsViews.join(" ")}
        />

        {/* Line for Visitors */}
        <polyline
          fill="none"
          stroke="#29251b"
          strokeWidth="2"
          strokeDasharray="3 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsVisitors.join(" ")}
        />

        {/* Data points & hover triggers */}
        {data.map((d, i) => {
          const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
          const y = height - padding - (d.views / maxVal) * (height - padding * 2);
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#f5c518" strokeWidth="2.5" />
            </g>
          );
        })}
      </svg>

      {/* X Axis labels */}
      <div className="mt-2 flex justify-between text-[11px] font-mono text-gray-400">
        <span>{data[0]?.date || ""}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date || ""}</span>}
        <span>{data[data.length - 1]?.date || ""}</span>
      </div>
    </div>
  );
}

export function DeviceDonut({ devices = { Desktop: 0, Mobile: 0, Tablet: 0 } }) {
  const total = (devices.Desktop || 0) + (devices.Mobile || 0) + (devices.Tablet || 0);

  if (total === 0) {
    return <div className="py-6 text-center text-xs text-gray-400">No device data yet</div>;
  }

  const deskPct = Math.round(((devices.Desktop || 0) / total) * 100);
  const mobPct = Math.round(((devices.Mobile || 0) / total) * 100);
  const tabPct = 100 - deskPct - mobPct;

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div style={{ width: `${deskPct}%` }} className="bg-[#29251b] transition-all" title={`Desktop: ${deskPct}%`} />
        <div style={{ width: `${mobPct}%` }} className="bg-[#f5c518] transition-all" title={`Mobile: ${mobPct}%`} />
        <div style={{ width: `${tabPct}%` }} className="bg-gray-400 transition-all" title={`Tablet: ${tabPct}%`} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="font-semibold text-gray-800">{deskPct}%</div>
          <div className="text-[11px] text-gray-500">Desktop</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="font-semibold text-gray-800">{mobPct}%</div>
          <div className="text-[11px] text-gray-500">Mobile</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="font-semibold text-gray-800">{tabPct}%</div>
          <div className="text-[11px] text-gray-500">Tablet</div>
        </div>
      </div>
    </div>
  );
}
