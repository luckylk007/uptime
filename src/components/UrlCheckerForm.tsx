"use client";

import React, { useState } from "react";
import { Plus, Trash2, Globe, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

interface UrlCheckerFormProps {
  onCheck: (urls: string[]) => Promise<void>;
  isLoading: boolean;
}

export function UrlCheckerForm({ onCheck, isLoading }: UrlCheckerFormProps) {
  const [urls, setUrls] = useState<string[]>([
    "https://google.com",
    "https://github.com",
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUrlChange = (index: number, value: string) => {
    setValidationError(null);
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleAddUrl = () => {
    if (urls.length >= 5) return;
    setUrls([...urls, ""]);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length <= 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const filtered = urls.map(u => u.trim()).filter(Boolean);
    if (filtered.length === 0) {
      setValidationError("Please enter at least one URL to check.");
      return;
    }

    if (filtered.length > 5) {
      setValidationError("Maximum 5 URLs allowed per check.");
      return;
    }

    // Basic format check
    for (const u of filtered) {
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        setValidationError(`URL "${u}" must start with http:// or https://`);
        return;
      }
    }

    await onCheck(filtered);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Target URLs (Max 5)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter up to 5 web addresses to test real-time availability and latency.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>SSRF Protected</span>
        </div>
      </div>

      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 select-none">
                #{index + 1}
              </span>
            </div>

            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(index)}
                disabled={isLoading}
                title="Remove URL"
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {validationError && (
        <div className="mt-3 p-2.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg">
          {validationError}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={urls.length >= 5 || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add URL ({urls.length}/5)
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking ({urls.filter(Boolean).length})...</span>
            </>
          ) : (
            <>
              <span>Check Uptime</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}