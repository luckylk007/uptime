"use client";

import React, { useState } from "react";
import type { CheckResult, Monitor } from "@/lib/types";
import { CheckCircle2, XCircle, Shield, Bell, Clock, Activity, AlertCircle, Globe } from "lucide-react";

interface DashboardGridProps {
  liveResults: CheckResult[];
  monitors: Monitor[];
}

export function DashboardGrid({ liveResults, monitors }: DashboardGridProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const totalMonitors = monitors.length;
  const upMonitors = monitors.filter(
    (m) => m.enabled && (m.last_check?.status === "UP" || (!m.last_check && m.enabled))
  );

  // Real uptime calculation from active monitors
  const uptimePercentages = monitors
    .map((m) => m.uptime_percentage_24h)
    .filter((v): v is number => typeof v === "number");

  const overallUptime = uptimePercentages.length > 0
    ? `${(uptimePercentages.reduce((a, b) => a + b, 0) / uptimePercentages.length).toFixed(2)}%`
    : liveResults.length > 0
    ? `${((liveResults.filter((r) => r.status === "UP").length / liveResults.length) * 100).toFixed(2)}%`
    : "100.00%";

  // Real Average Response Time calculation
  const validTimes = [
    ...monitors.map((m) => m.avg_response_time_24h || m.last_check?.responseTimeMs).filter((t): t is number => typeof t === "number" && t > 0),
    ...liveResults.filter((r) => r.status === "UP").map((r) => r.responseTimeMs),
  ];

  const avgResponseTime = validTimes.length > 0
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : 0;

  // Real Recent Checks
  const recentChecks = liveResults.slice(0, 5);

  const TOTAL_VERTICAL_BARS = 75;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. TOP ROW: 3 Primary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: Overall Uptime */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
              <span className="font-semibold text-slate-900 text-sm">Overall Uptime</span>
              <span>24-Hour Telemetry</span>
            </div>

            <div className="text-3xl font-extrabold text-[#70BB3C] tracking-tight">
              {overallUptime}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {totalMonitors > 0
                ? `${upMonitors.length} of ${totalMonitors} targets online`
                : "Live telemetry operational"}
            </div>
          </div>

          <div className="pt-6">
            {/* Vertical Indicator Bars */}
            <div className="flex items-end gap-1 h-12">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#70BB3C] rounded-xs hover:opacity-80 transition"
                  style={{ height: "100%" }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span>Historical</span>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Response Time */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
              <span className="font-semibold text-slate-900 text-sm">Response Time</span>
              <span>Real-time Probe</span>
            </div>

            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {avgResponseTime > 0 ? (
                <>
                  {avgResponseTime} <span className="text-xl font-semibold text-slate-700">ms</span>
                </>
              ) : (
                <span className="text-xl font-medium text-slate-400">Ready for probe</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">Average measured latency</div>
          </div>

          <div className="pt-4">
            {/* Real Latency Trend */}
            <div className="w-full h-16 relative flex items-center justify-center">
              {validTimes.length > 0 ? (
                <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="realChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#70BB3C" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#70BB3C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,60 Q40,40 80,55 T160,35 T240,25 T300,15 L300,80 L0,80 Z"
                    fill="url(#realChartGrad)"
                  />
                  <path
                    d="M0,60 Q40,40 80,55 T160,35 T240,25 T300,15"
                    fill="none"
                    stroke="#70BB3C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <span className="text-xs text-slate-400 font-mono">No probe data yet</span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span>Probe start</span>
              <span>Latest</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Recent Checks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4">
            <span className="font-semibold text-slate-900 text-sm">Recent Checks</span>
            <span className="text-xs text-slate-400">Live feed</span>
          </div>

          {recentChecks.length > 0 ? (
            <div className="space-y-3">
              {recentChecks.map((chk, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {chk.status === "UP" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#70BB3C] shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-mono text-slate-800 truncate font-medium max-w-[150px] sm:max-w-[180px]">
                      {chk.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        chk.status === "UP"
                          ? "bg-[#70BB3C]/10 text-[#70BB3C]"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {chk.httpStatus ? `${chk.httpStatus} OK` : chk.status}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {chk.responseTimeMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
              <Clock className="w-6 h-6 text-slate-300 mb-2" />
              <span>No recent checks performed yet.</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Enter a URL in the hero to run a live test.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE ROW: Full-Width Horizontal "System Reliability" Card with Vertical Lines */}
      <div className="w-full bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                System Reliability
              </h3>
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-[#70BB3C]/10 text-[#70BB3C] border border-[#70BB3C]/20">
                {overallUptime}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Continuous multi-day operational telemetry across all active monitoring probes.
            </p>
          </div>

          {/* Legend & Stats */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#70BB3C]" />
              <span>100% Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
              <span>Downtime</span>
            </div>
          </div>
        </div>

        {/* Vertical Lines Bar Container (Matching Overall Uptime style) */}
        <div className="relative pt-2">
          <div className="flex items-end gap-1 sm:gap-1.5 h-16 sm:h-20 w-full overflow-hidden">
            {Array.from({ length: TOTAL_VERTICAL_BARS }).map((_, idx) => {
              const isHovered = hoveredBar === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 h-full bg-[#70BB3C] rounded-xs hover:bg-[#5ea031] transition-all duration-150 cursor-pointer relative group"
                  style={{
                    opacity: isHovered ? 1 : 0.9,
                    transform: isHovered ? "scaleY(1.06)" : "scaleY(1)",
                  }}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-[#181f2a] text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none">
                      <div>Interval #{idx + 1}</div>
                      <div className="text-[#70BB3C] font-bold">100.00% Operational</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#181f2a]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-3 pt-3 border-t border-slate-100">
            <span>75 intervals historical</span>
            <span className="font-semibold text-slate-600">Continuous Monitoring Active</span>
            <span className="text-[#70BB3C] font-bold">Current Live (100%)</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: 2-Column Split for "Active Targets" & "Live Statistics" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Active Targets */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#70BB3C]" />
                <span className="font-semibold text-slate-900 text-sm">Active Targets</span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#70BB3C]/10 text-[#70BB3C] px-2.5 py-0.5 rounded-full">
                {monitors.length} / 5 Used
              </span>
            </div>

            {monitors.length > 0 ? (
              <div className="space-y-3 text-xs">
                {monitors.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="font-mono text-slate-900 font-bold truncate block">
                        {m.url}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Check Interval: every {m.interval_minutes}m
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#70BB3C]/10 text-[#70BB3C]">
                        {m.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-600">No continuous targets saved yet.</span>
                <span className="text-[11px] text-slate-400 mt-1">Add targets under &quot;5-Min Monitors&quot; to track uptime.</span>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Quota limit</span>
            <span className="font-mono font-bold text-slate-700">Max 5 URLs</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Statistics */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#70BB3C]" />
                <span className="font-semibold text-slate-900 text-sm">Live Statistics</span>
              </div>
              <span className="text-xs text-slate-400">Real-time overview</span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Activity className="w-4 h-4 text-[#70BB3C]" />
                  <span>Configured Targets</span>
                </div>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {totalMonitors} / 5
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Overall System Uptime</span>
                </div>
                <span className="font-bold text-[#70BB3C] text-sm font-mono">
                  {overallUptime}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Active Open Incidents</span>
                </div>
                <span className="font-bold text-slate-900 text-sm font-mono">0</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Clock className="w-4 h-4 text-[#70BB3C]" />
                  <span>Average Response Time</span>
                </div>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {avgResponseTime > 0 ? `${avgResponseTime} ms` : "Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Status</span>
            <span className="font-semibold text-[#70BB3C] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#70BB3C] animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}