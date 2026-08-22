"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Bell,
  Activity,
  Eye,
  Zap,
  ShieldCheck,
  LineChart,
  AlertTriangle,
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface CarouselItem {
  tag: string;
  title1: string;
  title2: string;
  description: string;
  icon: React.ElementType;
}

const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    tag: "MAXIMIZE UPTIME",
    title1: "More Uptime.",
    title2: "More Profit.",
    description: "Every second counts. Reduce downtime, avoid losses, and keep your business running 24/7.",
    icon: TrendingUp,
  },
  {
    tag: "SMART ALERTS",
    title1: "Never Miss a",
    title2: "Downtime Event.",
    description: "Get instant real-time alerts the second your website or API goes offline.",
    icon: Bell,
  },
  {
    tag: "24/7 AUTOMATION",
    title1: "Stay Online.",
    title2: "Stay Ready.",
    description: "Continuous 5-minute automated health checks ensure seamless reliability around the clock.",
    icon: Activity,
  },
  {
    tag: "PROACTIVE TELEMETRY",
    title1: "Know Before",
    title2: "Your Users Do.",
    description: "Detect issues instantly and take action before customers notice slow load times.",
    icon: Eye,
  },
  {
    tag: "FAST RESPONSE",
    title1: "Faster Alerts.",
    title2: "Faster Action.",
    description: "Multi-channel notifications keep your engineering and ops teams instantly informed.",
    icon: Zap,
  },
  {
    tag: "ENTERPRISE SECURITY",
    title1: "Your Website.",
    title2: "Always Watched.",
    description: "Continuous monitoring with SSRF protection keeps your infrastructure safe and stable.",
    icon: ShieldCheck,
  },
  {
    tag: "DEEP DIAGNOSTICS",
    title1: "Track Every",
    title2: "Single Second.",
    description: "See microsecond DNS lookup, connection handshakes, and TTFB latency at a glance.",
    icon: LineChart,
  },
  {
    tag: "EARLY PREVENTION",
    title1: "Catch Problems",
    title2: "Before Outages.",
    description: "Detect slowdowns and network bottlenecks before they become critical downtime.",
    icon: AlertTriangle,
  },
  {
    tag: "GLOBAL TELEMETRY",
    title1: "Monitor From",
    title2: "50+ Global Cities.",
    description: "Probe website availability from New Delhi, Singapore, Seoul, Dublin, Paris, and New York.",
    icon: Globe,
  },
  {
    tag: "SCALABLE SUCCESS",
    title1: "Less Downtime.",
    title2: "More Growth.",
    description: "Keep your website reliable, your customers delighted, and your revenue protected.",
    icon: Sparkles,
  },
];

export function VerticalHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const visibleIndices = [
    activeIndex,
    (activeIndex + 1) % CAROUSEL_ITEMS.length,
    (activeIndex + 2) % CAROUSEL_ITEMS.length,
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto flex items-stretch gap-3 sm:gap-4 select-none">
      {/* 1. Left Vertical Stepper Bar */}
      <div className="flex flex-col items-center justify-between py-6 px-1 shrink-0 relative">
        {/* Connecting Line */}
        <div className="absolute top-8 bottom-8 w-[1.5px] bg-slate-800" />

        {/* Stepper Nodes */}
        {visibleIndices.map((itemIdx, stepIdx) => {
          const isActive = stepIdx === 0;
          const displayNum = String(itemIdx + 1).padStart(2, "0");

          return (
            <div
              key={stepIdx}
              onClick={() => setActiveIndex(itemIdx)}
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-[#70BB3C] text-slate-950 shadow-lg shadow-[#70BB3C]/40 scale-110 ring-4 ring-[#70BB3C]/20"
                    : "bg-[#0d1728] text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-white animate-pulse" : "bg-slate-500"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-mono font-bold transition ${
                  isActive ? "text-[#70BB3C]" : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                {displayNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Main Vertical Stack Container */}
      <div className="flex-1 bg-[#091222]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-800/80 shadow-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
        {/* Cards Stack */}
        <div className="space-y-3">
          {visibleIndices.map((itemIdx, slotIdx) => {
            const item = CAROUSEL_ITEMS[itemIdx];
            const Icon = item.icon;
            const isTopActive = slotIdx === 0;

            return (
              <div
                key={itemIdx}
                onClick={() => setActiveIndex(itemIdx)}
                className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden flex items-start gap-4 ${
                  isTopActive
                    ? "bg-gradient-to-r from-[#0d1a31] to-[#122340] border border-[#70BB3C]/40 shadow-xl shadow-black/40 scale-[1.01]"
                    : "bg-[#091220]/50 border border-slate-800/60 opacity-60 hover:opacity-85 hover:border-slate-700"
                }`}
              >
                {/* Icon Box */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition ${
                    isTopActive
                      ? "bg-[#70BB3C]/10 border-[#70BB3C]/40 text-[#70BB3C] shadow-inner shadow-[#70BB3C]/20"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-8">
                  <div
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-1 transition ${
                      isTopActive ? "text-[#70BB3C]" : "text-slate-500"
                    }`}
                  >
                    {item.tag}
                  </div>

                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    <span className="text-white">{item.title1} </span>
                    <span className="text-[#70BB3C]">{item.title2}</span>
                  </h3>

                  <p
                    className={`text-xs mt-1.5 leading-relaxed line-clamp-2 transition ${
                      isTopActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Right Circular Action Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition ${
                      isTopActive
                        ? "bg-[#70BB3C]/10 border-[#70BB3C]/40 text-[#70BB3C] hover:bg-[#70BB3C] hover:text-slate-950 shadow-xs"
                        : "bg-slate-900 border-slate-800 text-slate-600"
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Bottom Progress Navigation Pills */}
        <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-800/60">
          {CAROUSEL_ITEMS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-6 bg-[#70BB3C]"
                  : "w-2 bg-slate-700 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}