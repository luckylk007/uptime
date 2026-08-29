"use client";

import React, { useState } from "react";
import type { RegionLatency } from "@/lib/types";
import { Check, Globe2, AlertCircle } from "lucide-react";

interface MultiCountryGridProps {
  regions?: RegionLatency[];
  url?: string;
}

export function MultiCountryGrid({ regions, url }: MultiCountryGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!regions || regions.length === 0) {
    return (
      <div className="w-full text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <Globe2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800">
          No Global Latency Data Yet
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Enter a website URL above and click &quot;Check Uptime&quot; to measure real-time DNS resolution, connection handshakes, and download speeds across global probe regions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-[#3b8252]" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Global Probe Regions & Latency Breakdown
            </h3>
            {url && (
              <p className="text-xs text-slate-500 font-mono">
                Live probe telemetry for: {url}
              </p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#ec4899]" />
            <span>Resolve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#8b5cf6]" />
            <span>Connection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8]" />
            <span>Download</span>
          </div>
        </div>
      </div>

      {/* 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {regions.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const isUp = item.status === "UP";

          const resolvePct = Math.max(8, Math.round((item.resolveTimeSec / (item.totalTimeSec || 1)) * 100));
          const connectPct = Math.max(12, Math.round((item.connectTimeSec / (item.totalTimeSec || 1)) * 100));
          const downloadPct = Math.max(20, 100 - resolvePct - connectPct);

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative rounded-xl overflow-visible shadow-sm border border-slate-200/90 transition-all duration-200 hover:shadow-md cursor-default group"
            >
              {/* Header Box (Green / Red) */}
              <div
                className={`p-3 rounded-t-xl flex items-center gap-2.5 text-white ${
                  isUp ? "bg-[#3b8252]" : "bg-rose-600"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white flex items-center justify-center shrink-0">
                  {isUp ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm leading-tight truncate">
                    {item.cityName}
                  </div>
                  <div className="text-[10px] text-white/80 leading-tight mt-0.5">
                    {item.statusText}
                  </div>
                </div>
              </div>

              {/* Bottom Body Box (Light Mint / Soft Rose) */}
              <div
                className={`p-3 rounded-b-xl flex items-center justify-between gap-2 ${
                  isUp ? "bg-[#eaf5ee]" : "bg-rose-50"
                }`}
              >
                {/* 3-Segment Timing Bar */}
                <div className="flex-1 flex items-center h-3 rounded-xs overflow-hidden max-w-[120px] bg-slate-200">
                  {isUp ? (
                    <>
                      <div
                        style={{ width: `${resolvePct}%` }}
                        className="h-full bg-[#ec4899]"
                        title={`Resolve time: ${item.resolveTimeSec}s`}
                      />
                      <div
                        style={{ width: `${connectPct}%` }}
                        className="h-full bg-[#8b5cf6]"
                        title={`Connection time: ${item.connectTimeSec}s`}
                      />
                      <div
                        style={{ width: `${downloadPct}%` }}
                        className="h-full bg-[#38bdf8]"
                        title={`Download time: ${item.downloadTimeSec}s`}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-rose-500" />
                  )}
                </div>

                {/* Total Time in seconds */}
                <div className="font-mono text-sm font-bold text-slate-800 shrink-0">
                  {isUp ? `${item.totalTimeSec.toFixed(2)}s` : "FAILED"}
                </div>
              </div>

              {/* Interactive Hover Tooltip Box */}
              {isHovered && isUp && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 bg-[#181f2a] text-white rounded-lg p-3 text-xs shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-xs bg-[#ec4899]" />
                        Resolve time
                      </span>
                      <span className="font-semibold text-white">
                        {item.resolveTimeSec.toFixed(3)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-xs bg-[#8b5cf6]" />
                        Connection time
                      </span>
                      <span className="font-semibold text-white">
                        {item.connectTimeSec.toFixed(3)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-xs bg-[#38bdf8]" />
                        Download time
                      </span>
                      <span className="font-semibold text-white">
                        {item.downloadTimeSec.toFixed(3)}s
                      </span>
                    </div>

                    <div className="border-t border-slate-700 pt-1.5 mt-1.5 flex items-center justify-between">
                      <span className="text-slate-400">Total time</span>
                      <span className="font-bold text-white">
                        {item.totalTimeSec.toFixed(3)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Total size</span>
                      <span className="font-medium text-slate-200">
                        {item.totalSizeKb}kB
                      </span>
                    </div>
                  </div>

                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#181f2a]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}