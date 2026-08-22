"use client";

import React, { useState } from "react";
import type { Monitor, DbCheck, Incident } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "./StatusBadge";
import { ResponseTimeChart } from "./ResponseTimeChart";
import { IncidentHistory } from "./IncidentHistory";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Plus,
  Loader2,
  ArrowUpRight,
  UserPlus,
} from "lucide-react";

interface MonitorListProps {
  monitors: Monitor[];
  isLoading?: boolean;
  onRefreshMonitors: () => Promise<void> | void;
  onOpenAddModal: () => void;
  onOpenAuth?: () => void;
}

export function MonitorList({
  monitors,
  isLoading = false,
  onRefreshMonitors,
  onOpenAddModal,
  onOpenAuth,
}: MonitorListProps) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, { checks: DbCheck[]; incidents: Incident[] }>>({});
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    if (!historyData[id]) {
      try {
        const res = await fetch(`/api/monitors/${id}/history?limit=30`);
        if (res.ok) {
          const data = await res.json();
          setHistoryData((prev) => ({
            ...prev,
            [id]: { checks: data.checks || [], incidents: data.incidents || [] },
          }));
        }
      } catch {
        // ignore
      }
    }
  };

  const handleToggleEnabled = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if (res.ok) {
        await onRefreshMonitors();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this monitor?")) return;

    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await onRefreshMonitors();
        if (expandedId === id) setExpandedId(null);
      }
    } catch {
      // ignore
    }
  };

  const handleManualCheck = async (monitor: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(monitor.id);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [monitor.url] }),
      });

      if (res.ok) {
        await onRefreshMonitors();
        if (expandedId === monitor.id) {
          const histRes = await fetch(`/api/monitors/${monitor.id}/history?limit=30`);
          if (histRes.ok) {
            const data = await histRes.json();
            setHistoryData((prev) => ({
              ...prev,
              [monitor.id]: { checks: data.checks || [], incidents: data.incidents || [] },
            }));
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(null);
    }
  };

  if (isLoading && monitors.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#70BB3C] mb-3" />
        <span className="text-xs">Loading user monitors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions & Quota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#70BB3C]" />
              5-Minute Continuous Monitors
            </h2>
            <span className="text-xs font-mono font-bold bg-[#70BB3C]/10 text-[#70BB3C] px-2.5 py-0.5 rounded-full">
              {monitors.length} / 5 Max
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {user
              ? `Connected to profile (${user.email})`
              : "Sign in to save and sync your personal 5-minute monitors"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!user && onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            disabled={monitors.length >= 5}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#70BB3C] hover:bg-[#5ea031] rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Monitor ({monitors.length}/5)</span>
          </button>
        </div>
      </div>

      {/* Monitors List */}
      {monitors.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Clock className="w-12 h-12 text-[#70BB3C] mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-900">
            No 5-Minute Monitors Added Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto mb-6 leading-relaxed">
            Add up to 5 target websites. Our system will check HTTP availability, DNS resolution, and latency every 5 minutes.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#70BB3C] hover:bg-[#5ea031] rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First 5-Min Monitor</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => {
            const isExpanded = expandedId === m.id;
            const currentStatus = m.last_check?.status || (m.enabled ? "UP" : "DOWN");
            const uptime = m.uptime_percentage_24h ?? 100;
            const avgLatency = m.avg_response_time_24h || m.last_check?.responseTimeMs || 0;

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition hover:border-slate-300"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(m.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 truncate">
                        {m.url}
                      </span>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-[#70BB3C]"
                        title="Open website"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Every {m.interval_minutes}m
                      </span>

                      <span className="text-[11px]">
                        Uptime:{" "}
                        <strong className="text-[#70BB3C] font-bold">
                          {uptime}%
                        </strong>
                      </span>

                      {avgLatency > 0 && (
                        <span className="text-[11px]">
                          Avg: <strong className="text-slate-700 font-mono">{avgLatency}ms</strong>
                        </span>
                      )}

                      {m.last_check?.checkedAt && (
                        <span className="text-[10px] text-slate-400">
                          Last probe: {new Date(m.last_check.checkedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <StatusBadge
                      status={m.enabled ? currentStatus : "DOWN"}
                      httpStatus={m.last_check?.httpStatus}
                    />

                    {/* Manual Probe Button */}
                    <button
                      type="button"
                      onClick={(e) => handleManualCheck(m, e)}
                      disabled={isRefreshing === m.id}
                      title="Run check now"
                      className="p-2 text-slate-400 hover:text-[#70BB3C] hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshing === m.id ? "animate-spin text-[#70BB3C]" : ""}`}
                      />
                    </button>

                    {/* Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleEnabled(m.id, m.enabled, e)}
                      title={m.enabled ? "Pause monitor" : "Resume monitor"}
                      className={`p-2 rounded-lg transition ${
                        m.enabled
                          ? "text-amber-500 hover:bg-amber-50"
                          : "text-[#70BB3C] hover:bg-emerald-50"
                      }`}
                    >
                      {m.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(m.id, e)}
                      title="Delete monitor"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand Chevron */}
                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">
                        Historical Latency (ms)
                      </h4>
                      <ResponseTimeChart checks={historyData[m.id]?.checks || []} />
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">
                        Recent Incidents & Outages
                      </h4>
                      <IncidentHistory incidents={historyData[m.id]?.incidents || []} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}