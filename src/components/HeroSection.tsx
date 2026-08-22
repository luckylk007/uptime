"use client";

import React, { useState } from "react";
import { CheckCircle2, MapPin, Clock, Bell, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { WaveBackground } from "./WaveBackground";

interface HeroSectionProps {
  onCheck: (urls: string[]) => Promise<void>;
  isLoading: boolean;
}

export function HeroSection({ onCheck, isLoading }: HeroSectionProps) {
  const [urls, setUrls] = useState<string[]>(["https://example.com"]);
  const [error, setError] = useState<string | null>(null);

  const handleAddUrl = () => {
    if (urls.length >= 5) return;
    setUrls([...urls, ""]);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length <= 1) return;
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, val: string) => {
    setError(null);
    const updated = [...urls];
    updated[index] = val;
    setUrls(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filtered = urls.map((u) => u.trim()).filter(Boolean);
    if (filtered.length === 0) {
      setError("Please enter at least one URL to check.");
      return;
    }

    if (filtered.length > 5) {
      setError("Maximum 5 URLs allowed.");
      return;
    }

    for (const u of filtered) {
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        setError(`URL "${u}" must start with http:// or https://`);
        return;
      }
    }

    await onCheck(filtered);
  };

  return (
    <section className="w-full bg-[#070e1e] text-white pt-12 pb-24 relative overflow-hidden">
      {/* WebGL2 Wave Canvas Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-80">
        <WaveBackground className="absolute inset-0 w-full h-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading, Inputs & Badges */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.12]">
              Monitor your websites.
              <br />
              Stay <span className="text-[#70BB3C]">100% online.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg drop-shadow-xs">
              Real-time uptime monitoring, instant alerts, and detailed performance insights — all in one place.
            </p>

            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 max-w-xl">
              {urls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleUrlChange(idx, e.target.value)}
                      placeholder="Enter your website (e.g. https://example.com)"
                      disabled={isLoading}
                      className="w-full px-4 py-3.5 text-sm bg-[#0e1a2f]/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#70BB3C] focus:ring-1 focus:ring-[#70BB3C] transition font-sans shadow-lg"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>

                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(idx)}
                      disabled={isLoading}
                      className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {idx === 0 && urls.length === 1 && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#70BB3C] hover:bg-[#5ea031] text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition shrink-0 flex items-center gap-2 shadow-md disabled:opacity-50 active:scale-98"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Check Uptime</span>
                      )}
                    </button>
                  )}
                </div>
              ))}

              {urls.length > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={urls.length >= 5 || isLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-[#0e1a2f]/90 border border-slate-700 px-3.5 py-2 rounded-lg transition disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#70BB3C]" />
                    Add Another URL ({urls.length}/5)
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#70BB3C] hover:bg-[#5ea031] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-md disabled:opacity-50 active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking ({urls.length})...</span>
                      </>
                    ) : (
                      <>
                        <span>Check Uptime ({urls.length})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {urls.length === 1 && (
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition pt-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#70BB3C]" />
                  <span>Check multiple websites (up to 5)</span>
                </button>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs shadow-md">
                  {error}
                </div>
              )}
            </form>

            {/* Feature Bullets */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 bg-[#0e1a2f]/50 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800/60">
                <MapPin className="w-4 h-4 text-[#70BB3C]" />
                <span>50+ Global Locations</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0e1a2f]/50 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800/60">
                <Clock className="w-4 h-4 text-[#70BB3C]" />
                <span>1-Minute Check Intervals</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0e1a2f]/50 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800/60">
                <Bell className="w-4 h-4 text-[#70BB3C]" />
                <span>Instant Notifications</span>
              </div>
            </div>
          </div>

          {/* Right Column: World Map Visualization & Operational Card */}
          <div className="lg:col-span-6 relative">
            {/* World Map Container */}
            <div className="w-full bg-[#0a1329]/85 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
              {/* World Map SVG Dots */}
              <div className="w-full h-64 relative flex items-center justify-center opacity-85">
                <svg viewBox="0 0 1000 500" className="w-full h-full text-slate-700/60" fill="currentColor">
                  {/* North America */}
                  <circle cx="220" cy="140" r="4" fill="#70BB3C" className="animate-pulse" />
                  <circle cx="220" cy="140" r="14" fill="#70BB3C" opacity="0.25" />
                  <circle cx="280" cy="180" r="5" fill="#70BB3C" />
                  <circle cx="280" cy="180" r="16" fill="#70BB3C" opacity="0.25" />
                  
                  {/* Europe */}
                  <circle cx="510" cy="130" r="5" fill="#70BB3C" />
                  <circle cx="510" cy="130" r="16" fill="#70BB3C" opacity="0.25" />
                  <circle cx="550" cy="160" r="4" fill="#70BB3C" />

                  {/* Asia */}
                  <circle cx="730" cy="220" r="5" fill="#70BB3C" />
                  <circle cx="730" cy="220" r="16" fill="#70BB3C" opacity="0.25" />
                  <circle cx="810" cy="190" r="4" fill="#70BB3C" />

                  {/* Australia */}
                  <circle cx="840" cy="360" r="5" fill="#70BB3C" />
                  <circle cx="840" cy="360" r="16" fill="#70BB3C" opacity="0.25" />

                  {/* Continent Dots Patterns */}
                  <g fill="#334155" opacity="0.45">
                    <circle cx="180" cy="120" r="3" /><circle cx="200" cy="110" r="3" /><circle cx="240" cy="110" r="3" /><circle cx="260" cy="130" r="3" />
                    <circle cx="200" cy="160" r="3" /><circle cx="230" cy="170" r="3" /><circle cx="250" cy="200" r="3" /><circle cx="300" cy="220" r="3" />
                    <circle cx="480" cy="110" r="3" /><circle cx="500" cy="100" r="3" /><circle cx="530" cy="120" r="3" /><circle cx="560" cy="110" r="3" />
                    <circle cx="490" cy="150" r="3" /><circle cx="520" cy="170" r="3" /><circle cx="580" cy="180" r="3" /><circle cx="620" cy="150" r="3" />
                    <circle cx="680" cy="160" r="3" /><circle cx="710" cy="180" r="3" /><circle cx="750" cy="170" r="3" /><circle cx="780" cy="210" r="3" />
                    <circle cx="700" cy="260" r="3" /><circle cx="740" cy="270" r="3" /><circle cx="760" cy="290" r="3" />
                    <circle cx="820" cy="320" r="3" /><circle cx="850" cy="340" r="3" /><circle cx="870" cy="360" r="3" />
                  </g>
                </svg>
              </div>

              {/* Floating "All Systems Operational" Status Card */}
              <div className="absolute top-8 left-8 bg-[#070e1e]/92 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-lg max-w-xs">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#70BB3C]/20 text-[#70BB3C] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">
                    All Systems Operational
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
                  <span className="font-semibold text-white">100.00%</span>
                  <span>Uptime (Last 30 days)</span>
                </div>

                {/* Status Bar Ticks in #70BB3C */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full bg-[#70BB3C]"
                    />
                  ))}
                </div>
              </div>

              {/* Pulse / Heartbeat Line in #70BB3C */}
              <div className="absolute bottom-3 right-6 w-52 h-12 flex items-center">
                <svg viewBox="0 0 200 40" className="w-full h-full text-[#70BB3C]">
                  <path
                    d="M 0,20 L 60,20 L 75,5 L 90,35 L 105,10 L 120,28 L 135,20 L 200,20"
                    fill="none"
                    stroke="#70BB3C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curved Bottom Wave Transition to White Background */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-10 sm:h-14 text-[#f8fafc]"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,20 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  );
}