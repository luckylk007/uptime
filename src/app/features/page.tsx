"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  Zap,
  Activity,
  Bell,
  Server,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: Globe,
      title: "Global Multi-Region Telemetry",
      description:
        "Check your websites from 12+ major global edge cities (New Delhi, Singapore, Seoul, Dublin, Paris, New York) with detailed DNS resolve, connection handshake, and TTFB breakdown.",
      highlight: "12 Global Regions",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise SSRF & Security Defense",
      description:
        "Multi-layer defense protecting against SSRF attacks, DNS rebinding, internal RFC1918 IPv4/IPv6 probing, and AWS/GCP cloud metadata access with automatic redirection re-validation.",
      highlight: "RFC1918 Defense",
    },
    {
      icon: Activity,
      title: "Continuous 5-Minute Probes",
      description:
        "Automated background health checks that test HTTP status codes, SSL certificate validity, response latency, and network timeouts around the clock.",
      highlight: "5-Minute Intervals",
    },
    {
      icon: Zap,
      title: "Microsecond Latency Profiling",
      description:
        "Isolate slow queries and network bottlenecks with dedicated timing metrics for DNS Lookup, TCP/TLS Handshake, and payload transfer sizes.",
      highlight: "Sub-millisecond Precision",
    },
    {
      icon: Bell,
      title: "Instant Incident Detection",
      description:
        "Automatic downtime tracking with root-cause diagnostics, duration logging, and zero-noise incident deduplication so you only get notified when it matters.",
      highlight: "Root-Cause Logging",
    },
    {
      icon: Server,
      title: "Supabase PostgreSQL Database",
      description:
        "High-performance cloud PostgreSQL architecture with Row Level Security (RLS), custom retention indexes, and real-time database synchronisation.",
      highlight: "PostgreSQL & RLS",
    },
  ];

  return (
    <div className="w-full bg-[#f8fafc]">
      {/* 1. Dark Hero Section */}
      <section className="bg-[#070e1e] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] text-xs font-bold tracking-wide uppercase mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Enterprise Feature Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight font-sans">
            Engineered for <span className="text-[#70BB3C]">100% Uptime</span> & Total Observability
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Everything you need to monitor, diagnose, and maintain website availability, global latency, and network security in real time.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-[#70BB3C] hover:bg-[#5ea031] text-white font-bold text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-[#70BB3C]/20"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition border border-slate-700"
            >
              Explore API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Features Grid - Clean Solid Background */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Powerful Monitoring Capabilities
          </h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            A complete suite of diagnostic and security tools built specifically for developers and ops teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#70BB3C]/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                      {f.highlight}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {f.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#70BB3C]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Production Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-[#070e1e] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Start Monitoring Your Websites in Seconds
            </h2>
            <p className="text-slate-400 text-sm">
              Free plan includes up to 5 websites with 5-minute automated checks. No credit card required.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#70BB3C] hover:bg-[#5ea031] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition shadow-lg shadow-[#70BB3C]/20"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}