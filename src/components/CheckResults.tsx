import React from "react";
import { CheckResult } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Clock, ArrowUpRight, AlertCircle, CheckCircle2, XCircle, Activity } from "lucide-react";

interface CheckResultsProps {
  results: CheckResult[];
}

export function CheckResults({ results }: CheckResultsProps) {
  if (results.length === 0) {
    return (
      <div className="w-full text-center py-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No Checks Performed Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Enter up to 5 URLs in the form above and click &quot;Check Uptime&quot; to test real-time server responses.
        </p>
      </div>
    );
  }

  const upCount = results.filter(r => r.status === "UP").length;
  const downCount = results.filter(r => r.status === "DOWN" || r.status === "TIMEOUT" || r.status === "ERROR").length;
  const validTimes = results.filter(r => r.status === "UP").map(r => r.responseTimeMs);
  const avgTime = validTimes.length > 0
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : 0;

  return (
    <div className="w-full space-y-4">
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Checked</span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{results.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Up
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{upCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Down / Error
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{downCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Avg Latency
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {avgTime > 0 ? `${avgTime}ms` : "N/A"}
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-3">
        {results.map((res, index) => {
          const isRedirected = res.finalUrl && res.finalUrl !== res.url && res.finalUrl !== `${res.url}/`;
          
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {res.url}
                    </span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-500 transition"
                      title="Open URL"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {isRedirected && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
                      <span>Redirected to:</span>
                      <span className="truncate text-indigo-600 dark:text-indigo-400">{res.finalUrl}</span>
                    </div>
                  )}

                  {res.error && (
                    <div className="mt-1.5 flex items-start gap-1 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{res.error}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{res.responseTimeMs}ms</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(res.checkedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <StatusBadge status={res.status} httpStatus={res.httpStatus} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}