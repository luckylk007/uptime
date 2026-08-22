// Supabase Edge Function: /check
// Deno TypeScript edge function with strict SSRF protection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAX_URLS = 5;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isPrivateOrReservedIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true;
  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
  }
  return false;
}

async function validateUrl(rawUrl: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Only HTTP and HTTPS protocols are allowed" };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host === "metadata.google.internal" ||
      host === "instance-data"
    ) {
      return { valid: false, reason: `Internal host "${host}" is blocked` };
    }
    if (isPrivateOrReservedIp(host)) {
      return { valid: false, reason: `Private/reserved IP "${host}" is blocked` };
    }
    try {
      const records = await Deno.resolveDns(host, "A");
      for (const ip of records) {
        if (isPrivateOrReservedIp(ip)) {
          return { valid: false, reason: `Host resolves to private IP ${ip}` };
        }
      }
    } catch {
      // DNS resolution handled in network call
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Malformed URL format" };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const urls = body?.urls;

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Field 'urls' must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (urls.length > MAX_URLS) {
      return new Response(
        JSON.stringify({ error: `Exceeded max ${MAX_URLS} URLs per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.all(
      urls.map(async (urlStr: string) => {
        const checkedAt = new Date().toISOString();
        const validCheck = await validateUrl(urlStr);
        if (!validCheck.valid) {
          return {
            url: urlStr,
            status: "ERROR",
            httpStatus: null,
            responseTimeMs: 0,
            finalUrl: urlStr,
            checkedAt,
            error: `Security Check Failed: ${validCheck.reason}`,
          };
        }

        const start = performance.now();
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
          const res = await fetch(urlStr, {
            method: "GET",
            headers: { "User-Agent": "UptimeChecker/1.0 (+https://uptimechecker.app)" },
            signal: controller.signal,
          });
          clearTimeout(timer);

          const duration = Math.round(performance.now() - start);
          const httpStatus = res.status;
          const status = (httpStatus >= 200 && httpStatus < 400) ? "UP" : "DOWN";

          return {
            url: urlStr,
            status,
            httpStatus,
            responseTimeMs: duration,
            finalUrl: res.url || urlStr,
            checkedAt,
            error: status === "DOWN" ? `HTTP Error ${httpStatus}` : null,
          };
        } catch (err: any) {
          const duration = Math.round(performance.now() - start);
          const isTimeout = err.name === "AbortError" || duration >= TIMEOUT_MS;
          return {
            url: urlStr,
            status: isTimeout ? "TIMEOUT" : "ERROR",
            httpStatus: null,
            responseTimeMs: isTimeout ? TIMEOUT_MS : duration,
            finalUrl: urlStr,
            checkedAt,
            error: isTimeout ? `Request timed out after ${TIMEOUT_MS}ms` : (err.message || "Connection failed"),
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});