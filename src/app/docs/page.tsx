"use client";

import React, { useState } from "react";
import { BookOpen, Terminal, Code2, ShieldCheck, Check, Copy, ArrowRight } from "lucide-react";

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlCheck = `curl -X POST https://uptimechecker.app/api/check \\
  -H "Content-Type: application/json" \\
  -d '{
    "urls": ["https://google.com", "https://github.com"]
  }'`;

  const jsCheck = `const response = await fetch("https://uptimechecker.app/api/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    urls: ["https://mysite.com"]
  })
});

const data = await response.json();
console.log(data.results[0].status); // "UP" | "DOWN" | "TIMEOUT"`;

  const pythonCheck = `import requests

res = requests.post(
    "https://uptimechecker.app/api/check",
    json={"urls": ["https://mysite.com"]}
)

print(res.json())`;

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen">
      {/* 1. Header */}
      <section className="bg-[#070e1e] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Reference</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Platform Documentation & REST API
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Integrate automated uptime checking, global multi-region latency telemetry, and monitor CRUD into your applications.
          </p>
        </div>
      </section>

      {/* 2. Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20 space-y-8">
        {/* Endpoint 1: POST /api/check */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#70BB3C] text-white font-mono font-bold text-xs">
              POST
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              /api/check
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              Rate Limit: 60 req / min
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Performs an instantaneous, multi-region uptime probe on up to 5 URLs in parallel. Includes multi-layer SSRF validation, multi-hop redirect verification, and detailed DNS, connect, and download latency metrics.
          </p>

          {/* cURL Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                cURL Request
              </span>
              <button
                onClick={() => copyCode("curl", curlCheck)}
                className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "curl" ? <Check className="w-3.5 h-3.5 text-[#70BB3C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "curl" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a1120] text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              {curlCheck}
            </pre>
          </div>

          {/* JavaScript Snippet */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                JavaScript / TypeScript Fetch
              </span>
              <button
                onClick={() => copyCode("js", jsCheck)}
                className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "js" ? <Check className="w-3.5 h-3.5 text-[#70BB3C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "js" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a1120] text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              {jsCheck}
            </pre>
          </div>
        </div>

        {/* Endpoint 2: GET & POST /api/monitors */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
              GET / POST
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              /api/monitors
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Create or list continuous 5-minute automated monitors. Enforces quota limits (up to 5 targets per user) and binds to Supabase Row Level Security (RLS).
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs space-y-2 text-slate-800">
            <div className="font-bold text-slate-900">Payload Schema (POST /api/monitors):</div>
            <div>{`{ "url": "https://mysite.com", "interval_minutes": 5, "userId": "<UUID>" }`}</div>
          </div>
        </div>

        {/* Security Specifications Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#70BB3C]/10 text-[#70BB3C] rounded-xl border border-[#70BB3C]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              SSRF Defense & Network Security Rules
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            To protect your infrastructure and prevent malicious probes, our engine enforces the following checks on every single request:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-[#70BB3C] shrink-0 mt-0.5" />
              <span><strong>RFC1918 Blocked:</strong> 10.x, 172.16.x, 192.168.x IPs</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-[#70BB3C] shrink-0 mt-0.5" />
              <span><strong>Cloud Metadata Blocked:</strong> 169.254.169.254 AWS/GCP</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-[#70BB3C] shrink-0 mt-0.5" />
              <span><strong>Loopback Blocked:</strong> 127.0.0.1, localhost, ::1</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-[#70BB3C] shrink-0 mt-0.5" />
              <span><strong>Payload Protection:</strong> 16KB max payload & strict rate limits</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}