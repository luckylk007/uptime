"use client";

import React, { useEffect } from "react";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("Caught in ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#070e1e] flex items-center justify-center p-4">
      <div className="bg-[#0e1a2f] border border-slate-700/80 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-white">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            Temporary Loading Glitch
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The page encountered a temporary resource sync issue. Click retry below to reload fresh assets.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="flex-1 py-3 bg-[#70BB3C] hover:bg-[#5ea031] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Fresh Page</span>
          </button>

          <Link
            href="/"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}