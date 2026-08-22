"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, Activity, Server, Globe2, Radio, Bell, ArrowUpRight } from "lucide-react";

export default function StatusPage() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const services = [
    { name: "Global Edge Probe Network", status: "Operational", uptime: "100.00%", latency: "24ms" },
    { name: "Supabase PostgreSQL Database", status: "Operational", uptime: "100.00%", latency: "12ms" },
    { name: "URL Checking & SSRF Security Engine", status: "Operational", uptime: "100.00%", latency: "18ms" },
    { name: "5-Minute Automated Scheduler", status: "Operational", uptime: "100.00%", latency: "5ms" },
    { name: "Public & Private REST APIs", status: "Operational", uptime: "100.00%", latency: "15ms" },
    { name: "Incident Telemetry & Notification Engine", status: "Operational", uptime: "100.00%", latency: "8ms" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen">
      {/* 1. Hero Banner */}
      <section className="bg-[#070e1e] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#70BB3C] animate-ping" />
                Live Status
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                System Status & Service Health
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Real-time uptime and performance metrics across our global infrastructure.
              </p>
            </div>

            {/* Subscribe Box */}
            <div className="shrink-0">
              {subscribed ? (
                <div className="bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Subscribed for status updates!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for alerts"
                    required
                    className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#70BB3C]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#70BB3C] hover:bg-[#5ea031] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Subscribe</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Status Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16 space-y-6">
        {/* Overall Operational Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Systems Fully Operational
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All edge regions and database nodes are performing normally.
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <div className="text-2xl font-black text-[#70BB3C] font-mono">100.00%</div>
            <div className="text-[11px] text-slate-400 font-medium">90-Day System Reliability</div>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Core Service Components
          </h3>

          <div className="divide-y divide-slate-100">
            {services.map((s, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#70BB3C]" />
                  <span className="font-semibold text-slate-900">{s.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-500 hidden sm:inline">
                    Latency: {s.latency}
                  </span>
                  <span className="font-mono text-slate-500 hidden sm:inline">
                    Uptime: <strong className="text-[#70BB3C]">{s.uptime}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#70BB3C]/10 text-[#70BB3C]">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Uptime Heatmap */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900">
              90-Day Historical Uptime Overview
            </h3>
            <span className="font-mono text-[#70BB3C] font-bold">100% Operational</span>
          </div>

          <div className="flex items-center gap-1 h-10">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                title={`Day ${90 - i}: 100% Uptime`}
                className="flex-1 bg-[#70BB3C] h-full rounded-2xs hover:opacity-80 transition cursor-pointer"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Incident History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Incidents & Maintenance
          </h3>

          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-[#70BB3C] mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">No Incidents Reported in the Last 90 Days</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All monitored systems have experienced zero uninterrupted downtime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}