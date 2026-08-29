"use client";

import React from "react";
import type { DbCheck } from "@/lib/types";

interface ResponseTimeChartProps {
  checks: DbCheck[];
  height?: number;
}

export function ResponseTimeChart({ checks, height = 120 }: ResponseTimeChartProps) {
  if (!checks || checks.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800"
        style={{ height }}
      >
        No historical latency data available yet
      </div>
    );
  }

  // Take the most recent 20 checks in chronological order (oldest to newest)
  const data = [...checks].slice(0, 20).reverse();
  const maxMs = Math.max(...data.map((d) => d.response_time_ms || 0), 100);

  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-2">
        <span>Latency Trend (Last {data.length} checks)</span>
        <span>Max: {maxMs}ms</span>
      </div>

      <div className="flex items-end gap-1.5 h-20 pt-2 border-b border-slate-200 dark:border-slate-800">
        {data.map((c, i) => {
          const heightPct = Math.max(8, Math.min(100, Math.round((c.response_time_ms / maxMs) * 100)));
          const isUp = c.status === "UP";
          let barColor = "bg-emerald-500 dark:bg-emerald-400";
          if (!isUp) {
            barColor = "bg-rose-500 dark:bg-rose-400";
          } else if (c.response_time_ms > 800) {
            barColor = "bg-amber-500 dark:bg-amber-400";
          }

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap font-mono">
                  <div>{c.status} • {c.response_time_ms}ms</div>
                  <div className="text-[9px] text-slate-400">
                    {new Date(c.checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </div>
              </div>

              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${barColor} group-hover:opacity-80`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}