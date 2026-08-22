"use client";

import React from "react";
import type { Incident } from "@/lib/types";
import { AlertOctagon, CheckCircle2, Clock } from "lucide-react";

interface IncidentHistoryProps {
  incidents: Incident[];
}

export function IncidentHistory({ incidents }: IncidentHistoryProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5 opacity-80" />
        No downtime incidents recorded. 100% operational.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {incidents.map((inc) => {
        const isOpen = !inc.resolved_at;
        const durationText = inc.duration_seconds
          ? inc.duration_seconds < 60
            ? `${inc.duration_seconds}s`
            : `${Math.round(inc.duration_seconds / 60)}m`
          : "Ongoing";

        return (
          <div
            key={inc.id}
            className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
              isOpen
                ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                : "bg-slate-50/70 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertOctagon
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isOpen ? "text-rose-600 animate-pulse" : "text-slate-400"
                }`}
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>{isOpen ? "Active Outage" : "Resolved Outage"}</span>
                  <span className="font-mono text-[11px] font-normal text-slate-500 truncate">
                    {inc.url}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  Cause: {inc.cause}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Started: {new Date(inc.started_at).toLocaleString()}
                  {inc.resolved_at && ` • Recovered: ${new Date(inc.resolved_at).toLocaleTimeString()}`}
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isOpen
                    ? "bg-rose-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Clock className="w-3 h-3" />
                {durationText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}