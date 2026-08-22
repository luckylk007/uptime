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
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const total = CAROUSEL_ITEMS.length;

  // 3-card window where the CENTER card (index 1) is highlighted
  const topIdx = (activeIndex - 1 + total) % total;
  const centerIdx = activeIndex;
  const bottomIdx = (activeIndex + 1) % total;

  const cards = [
    { item: CAROUSEL_ITEMS[topIdx], position: "top", originalIdx: topIdx },
    { item: CAROUSEL_ITEMS[centerIdx], position: "center", originalIdx: centerIdx },
    { item: CAROUSEL_ITEMS[bottomIdx], position: "bottom", originalIdx: bottomIdx },
  ];

  return (
    <div className="w-full max-w-lg mx-auto select-none relative">
      {/* Cards Container with smooth cross-fade animation */}
      <div className="space-y-3.5 relative">
        {cards.map(({ item, position, originalIdx }) => {
          const isCenter = position === "center";
          const Icon = item.icon;

          return (
            <div
              key={`${position}-${originalIdx}`}
              onClick={() => setActiveIndex(originalIdx)}
              className={`p-4 sm:p-5 rounded-2xl transition-all duration-700 ease-in-out cursor-pointer relative overflow-hidden flex items-start gap-4 ${
                isCenter
                  ? "bg-gradient-to-r from-[#0d1a31] via-[#11223e] to-[#0e1c34] border-2 border-[#70BB3C] shadow-2xl shadow-[#70BB3C]/20 scale-100 opacity-100 z-20"
                  : "bg-[#091220]/60 border border-slate-800/80 scale-[0.95] opacity-40 hover:opacity-70 hover:scale-[0.97] blur-[0.3px] z-10"
              }`}
            >
              {/* Icon Box */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-700 ${
                  isCenter
                    ? "bg-[#70BB3C]/15 border-[#70BB3C]/50 text-[#70BB3C] shadow-inner shadow-[#70BB3C]/30"
                    : "bg-slate-900/80 border-slate-800 text-slate-500"
                }`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pr-8 transition-all duration-700">
                <div
                  className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-1 transition-colors duration-700 ${
                    isCenter ? "text-[#70BB3C]" : "text-slate-500"
                  }`}
                >
                  {item.tag}
                </div>

                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight transition-all duration-700">
                  <span className="text-white">{item.title1} </span>
                  <span className={isCenter ? "text-[#70BB3C]" : "text-slate-400"}>
                    {item.title2}
                  </span>
                </h3>

                <p
                  className={`text-xs mt-1.5 leading-relaxed line-clamp-2 transition-colors duration-700 ${
                    isCenter ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {item.description}
                </p>
              </div>

              {/* Right Action Arrow Indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-700 ${
                    isCenter
                      ? "bg-[#70BB3C] text-slate-950 shadow-md shadow-[#70BB3C]/30 scale-105"
                      : "bg-slate-900/80 border-slate-800 text-slate-600"
                  }`}
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}