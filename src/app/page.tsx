"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HeroSection } from "@/components/HeroSection";
import { DashboardGrid } from "@/components/DashboardGrid";
import { CheckResults } from "@/components/CheckResults";
import { MonitorList } from "@/components/MonitorList";
import { MultiCountryGrid } from "@/components/MultiCountryGrid";
import { AddMonitorModal } from "@/components/AddMonitorModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth-context";
import type { CheckResult, CheckResponse, Monitor } from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();
  const [liveResults, setLiveResults] = useState<CheckResult[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isMonitorsLoading, setIsMonitorsLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"dashboard" | "regions" | "manage">("dashboard");

  const fetchMonitors = useCallback(async () => {
    if (!user) {
      setMonitors([]);
      setIsMonitorsLoading(false);
      return;
    }

    try {
      setIsMonitorsLoading(true);
      const res = await fetch("/api/monitors", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      }
    } catch {
      // ignore
    } finally {
      setIsMonitorsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleCheckUrls = async (urls: string[]) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      const data: CheckResponse = await response.json();

      if (!response.ok) {
        setApiError(data.error || `Server responded with status ${response.status}`);
        return;
      }

      setLiveResults(data.results);
      if (user) {
        await fetchMonitors();
      }

      const resultsEl = document.getElementById("results-anchor");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to reach uptime check API");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. Hero Section with WebGL Wave Canvas */}
      <HeroSection onCheck={handleCheckUrls} isLoading={isLoading} />

      <div id="results-anchor" />

      {/* 2. Second Section - Clean Solid Background */}
      <section className="w-full relative py-8 bg-[#f8fafc]">
        <div>
          {/* Live Check Results Section with Multi-Country Grid */}
          {liveResults.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-10 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#70BB3C] animate-ping" />
                    Live Check Results ({liveResults.length})
                  </h3>
                  <button
                    onClick={() => setLiveResults([])}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Clear Results
                  </button>
                </div>
                <CheckResults results={liveResults} />
              </div>

              {/* Multi-Country Probe Grid for the latest checked URL */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
                <MultiCountryGrid
                  regions={liveResults[0]?.regions}
                  url={liveResults[0]?.url}
                />
              </div>
            </div>
          )}

          {apiError && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                <strong>Error:</strong> {apiError}
              </div>
            </div>
          )}

          {/* View Switcher Navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === "dashboard"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dashboard Overview
              </button>
              <button
                onClick={() => setActiveView("regions")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === "regions"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Global Regions (12 Cities)
              </button>
              <button
                onClick={() => setActiveView("manage")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === "manage"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                5-Min Monitors {user ? `(${monitors.length}/5)` : ""}
              </button>
            </div>
          </div>

          {/* Tab Views */}
          {activeView === "dashboard" && (
            <DashboardGrid liveResults={liveResults} monitors={monitors} />
          )}

          {activeView === "regions" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <MultiCountryGrid
                  regions={liveResults[0]?.regions}
                  url={liveResults[0]?.url || "https://example.com"}
                />
              </div>
            </div>
          )}

          {activeView === "manage" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <MonitorList
                monitors={monitors}
                isLoading={isMonitorsLoading}
                onRefreshMonitors={fetchMonitors}
                onOpenAddModal={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsAddModalOpen(true);
                  }
                }}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Add Monitor Modal */}
      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMonitorAdded={fetchMonitors}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}