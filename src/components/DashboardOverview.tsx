"use client";

import React from "react";
import type { Monitor } from "@/lib/types";
import { Activity, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

interface DashboardOverviewProps {
  monitors: Monitor[];
}

export function DashboardOverview({ monitors }: DashboardOverviewProps) {
  const total = monitors.length;
  const upMonitors = monitors.filter(
    (m) => m.enabled && (m.last_check?.status === "UP" || (!m.last_check && m.enabled))
  );
  const upCount = upMonitors.length;
  const downCount = total - upCount;

  // Calculate Overall Uptime %
  const uptimePercentages = monitors.map((m) => m.uptime_percentage_24h ?? 100);
  const overallUptime = total > 0
    ? Number((uptimePercentages.reduce((a, b) => a + b, 0) / total).toFixed(1))
    : 100;

  // Calculate Average Response Time
  const responseTimes = monitors
    .map((m) => m.avg_response_time_24h || m.last_check?.responseTimeMs || 0)
    .filter((ms) => ms > 0);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
      {/* Total Monitors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Monitors</span>
          <Activity className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{total}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Active targets</div>
      </div>

      {/* UP Monitors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">UP</span>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{upCount}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Operational</div>
      </div>

      {/* DOWN Monitors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">DOWN</span>
          <XCircle className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{downCount}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Incidents / Paused</div>
      </div>

      {/* Average Response Time */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Latency</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
          {avgResponseTime > 0 ? `${avgResponseTime}ms` : "N/A"}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Global average</div>
      </div>

      {/* Overall Uptime */}
      <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Overall Uptime</span>
          <Zap className="w-4 h-4 text-indigo-500" />
        </div>
        <div
          className={`text-2xl font-black ${
            overallUptime >= 99
              ? "text-emerald-600 dark:text-emerald-400"
              : overallUptime >= 95
              ? "text-amber-600 dark:text-amber-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {overallUptime}%
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">24-hour health</div>
      </div>
    </div>
  );
}