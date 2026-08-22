"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Bell, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { WaveBackground } from "./WaveBackground";
import { VerticalHeroCarousel } from "./VerticalHeroCarousel";

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading, Inputs & Badges */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.12]">
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
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-slate-700 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#70BB3C] hover:bg-[#5ea031] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#70BB3C]/25 disabled:opacity-50 active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Global Uptime...</span>
                    </>
                  ) : (
                    <>
                      <span>Check Uptime ({urls.length} URL{urls.length > 1 ? "s" : ""})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {urls.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={isLoading}
                    className="px-4 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#70BB3C]" />
                    <span>Add URL ({urls.length}/5)</span>
                  </button>
                )}
              </div>
            </form>

            {/* Feature Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5 bg-[#0e1a2f]/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#70BB3C]" />
                <span>50+ Global Locations</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0e1a2f]/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[#70BB3C]" />
                <span>1-Minute Check Intervals</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0e1a2f]/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg">
                <Bell className="w-3.5 h-3.5 text-[#70BB3C]" />
                <span>Instant Notifications</span>
              </div>
            </div>
          </div>

          {/* Right Column: Vertical Hero Carousel */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <VerticalHeroCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}