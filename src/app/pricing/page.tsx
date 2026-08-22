"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Zap, ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free Starter",
      badge: "Forever Free",
      price: "$0",
      period: "forever",
      description: "Ideal for individual developers, side projects, and personal websites.",
      buttonText: "Start for Free",
      buttonLink: "/signup",
      highlight: false,
      features: [
        "Up to 5 Continuous Monitors",
        "5-Minute Automated Checks",
        "12 Global Probe Regions",
        "SSRF & Private IP Security Filter",
        "30-Day Check History Log",
        "Email & In-App Alerts",
        "Community Support",
      ],
    },
    {
      name: "Pro Team",
      badge: "Most Popular",
      price: billingCycle === "monthly" ? "$19" : "$15",
      period: "per month",
      description: "For growing teams, production apps, and agency client websites.",
      buttonText: "Upgrade to Pro",
      buttonLink: "/signup",
      highlight: true,
      features: [
        "Up to 50 Continuous Monitors",
        "1-Minute High-Frequency Checks",
        "12 Global Probe Regions + TTFB",
        "Custom Public & Private Status Pages",
        "Instant Telegram, Slack & Webhooks",
        "1-Year Historical Metrics Retention",
        "SSL Expiration & TLS Alerts",
        "Priority Developer Support",
      ],
    },
    {
      name: "Enterprise",
      badge: "High Scale",
      price: billingCycle === "monthly" ? "$79" : "$65",
      period: "per month",
      description: "For high-traffic platforms, mission-critical infrastructure, and custom SLA needs.",
      buttonText: "Contact Enterprise",
      buttonLink: "/signup",
      highlight: false,
      features: [
        "Unlimited Continuous Monitors",
        "30-Second Real-Time Checks",
        "Custom Dedicated Probe IP Nodes",
        "Multi-User Role Permissions (RBAC)",
        "Custom SLA Guarantee (99.99%)",
        "Unlimited History & Data Export",
        "Dedicated Account Engineer",
        "24/7 Phone & Slack Escalation",
      ],
    },
  ];

  const faqs = [
    {
      q: "Can I monitor websites without creating an account?",
      a: "Yes! Our instant homepage checker allows anyone to run live on-demand probes with full multi-country latency breakdown without an account.",
    },
    {
      q: "How does the 5-minute free monitoring work?",
      a: "When you sign up for a free account, you can add up to 5 URLs. Our serverless edge scheduler checks them automatically every 5 minutes and logs historical uptime.",
    },
    {
      q: "Do I need to enter a credit card for the Free plan?",
      a: "No credit card is required for the Free Starter plan. You can start immediately.",
    },
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Yes, you can upgrade or cancel your subscription at any time directly from your user dashboard.",
    },
  ];

  return (
    <div className="w-full bg-[#f8fafc]">
      {/* 1. Dark Header */}
      <section className="bg-[#070e1e] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] text-xs font-bold uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Simple Transparent Pricing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Invest in <span className="text-[#70BB3C]">Zero Downtime</span> for Your Users
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Start for free with 5 websites, or scale up to high-frequency 1-minute monitoring for your production apps.
        </p>

        {/* Monthly / Yearly Switch */}
        <div className="pt-6 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-white" : "text-slate-400"}`}>
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-12 h-6 bg-slate-800 rounded-full p-1 border border-slate-700 transition relative"
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#70BB3C] transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${billingCycle === "yearly" ? "text-white" : "text-slate-400"}`}>
            Yearly <span className="text-[#70BB3C] font-mono font-normal">(Save 20%)</span>
          </span>
        </div>
      </section>

      {/* 2. Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                plan.highlight
                  ? "bg-white border-2 border-[#70BB3C] shadow-2xl relative scale-102"
                  : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      plan.highlight
                        ? "bg-[#70BB3C] text-white font-mono"
                        : "bg-slate-100 text-slate-700 font-mono"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-slate-900 font-mono">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/{plan.period}</span>
                </div>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  {plan.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#70BB3C]/10 text-[#70BB3C] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-700 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 mt-6">
                <Link
                  href={plan.buttonLink}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    plan.highlight
                      ? "bg-[#70BB3C] hover:bg-[#5ea031] text-white shadow-md shadow-[#70BB3C]/25"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#70BB3C] uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900">{f.q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}