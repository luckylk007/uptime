"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, Plus, Globe, Clock, Loader2, ShieldCheck, Lock } from "lucide-react";

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMonitorAdded: () => void;
  onOpenAuth?: () => void;
}

export function AddMonitorModal({ isOpen, onClose, onMonitorAdded, onOpenAuth }: AddMonitorModalProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL to monitor.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: trimmed,
          interval_minutes: interval,
          // NOTE: userId intentionally NOT sent — server reads it from JWT cookie
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create monitor");
        return;
      }

      setUrl("");
      onMonitorAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add 5-Minute Monitor
            </h2>
            <p className="text-xs text-slate-500">
              Automated continuous health checks (Max 5 targets).
            </p>
          </div>
        </div>

        {!user && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>You are not signed in.</span>{" "}
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="font-bold underline text-amber-900 hover:text-black"
                >
                  Sign in or create a free account
                </button>
              )}{" "}
              <span>to sync your monitors permanently to your user profile.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mysite.com"
              disabled={isLoading}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#70BB3C] focus:ring-1 focus:ring-[#70BB3C] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#70BB3C]" />
              Check Frequency
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#70BB3C] focus:ring-1 focus:ring-[#70BB3C]"
            >
              <option value={5}>Every 5 minutes (Recommended)</option>
              <option value={10}>Every 10 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every 60 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#70BB3C] shrink-0" />
            <span>Target host is validated against SSRF and private IP ranges before adding.</span>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#70BB3C] hover:bg-[#5ea031] rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Monitoring</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}