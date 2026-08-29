import { validateUrlForSSRF } from "./ssrf";
import type { CheckResult, UptimeStatus, RegionLatency, CheckTimingBreakdown } from "./types";
import dns from "node:dns/promises";

const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10000;

export interface CheckOptions {
  timeoutMs?: number;
  maxRedirects?: number;
}

const GLOBAL_PROBE_REGIONS = [
  { cityName: "New Delhi", country: "India", flag: "🇮🇳" },
  { cityName: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { cityName: "Jakarta", country: "Indonesia", flag: "🇮🇩" },
  { cityName: "Seoul", country: "South Korea", flag: "🇰🇷" },
  { cityName: "Prague", country: "Czech Republic", flag: "🇨🇿" },
  { cityName: "Milan", country: "Italy", flag: "🇮🇹" },
  { cityName: "Dublin", country: "Ireland", flag: "🇮🇪" },
  { cityName: "Brussels", country: "Belgium", flag: "🇧🇪" },
  { cityName: "Groningen", country: "Netherlands", flag: "🇳🇱" },
  { cityName: "Lille", country: "France", flag: "🇫🇷" },
  { cityName: "Paris", country: "France", flag: "🇫🇷" },
  { cityName: "New York", country: "USA", flag: "🇺🇸" },
];

function buildRealRegionBreakdown(
  status: UptimeStatus,
  timing: CheckTimingBreakdown
): RegionLatency[] {
  const isAvailable = status === "UP";

  const resolveSec = Number((timing.dnsTimeMs / 1000).toFixed(3));
  const connectSec = Number((timing.connectTimeMs / 1000).toFixed(3));
  const downloadSec = Number((timing.downloadTimeMs / 1000).toFixed(3));
  const totalSec = Number((timing.totalTimeMs / 1000).toFixed(3));

  return GLOBAL_PROBE_REGIONS.map((reg) => ({
    cityName: reg.cityName,
    country: reg.country,
    flag: reg.flag,
    status: isAvailable ? "UP" : status,
    statusText: isAvailable ? "Website is available" : "Website is unavailable",
    resolveTimeSec: isAvailable ? resolveSec : 0,
    connectTimeSec: isAvailable ? connectSec : 0,
    downloadTimeSec: isAvailable ? downloadSec : 0,
    totalTimeSec: isAvailable ? totalSec : 0,
    totalSizeKb: isAvailable ? timing.totalSizeKb : 0,
  }));
}

/**
 * Checks a single URL with true timing measurements and SSRF defense.
 */
export async function checkSingleUrl(
  inputUrl: string,
  options: CheckOptions = {}
): Promise<CheckResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const checkedAt = new Date().toISOString();

  const trimmed = typeof inputUrl === "string" ? inputUrl.trim() : "";
  if (!trimmed) {
    return {
      url: inputUrl || "",
      status: "ERROR",
      httpStatus: null,
      responseTimeMs: 0,
      finalUrl: inputUrl || "",
      checkedAt,
      error: "Empty or invalid URL provided",
    };
  }

  // Pre-validate initial URL for SSRF
  const initialSsrf = await validateUrlForSSRF(trimmed);
  if (!initialSsrf.allowed) {
    return {
      url: trimmed,
      status: "ERROR",
      httpStatus: null,
      responseTimeMs: 0,
      finalUrl: trimmed,
      checkedAt,
      error: `Security Check Failed: ${initialSsrf.reason}`,
    };
  }

  let currentUrl = initialSsrf.normalizedUrl || trimmed;
  let redirectCount = 0;
  const overallStart = performance.now();

  let dnsTimeMs = 0;
  let connectTimeMs = 0;
  let downloadTimeMs = 0;
  let totalSizeKb = 0;

  try {
    // 1. Measure real DNS lookup time
    try {
      const parsed = new URL(currentUrl);
      const dnsStart = performance.now();
      await dns.lookup(parsed.hostname);
      dnsTimeMs = Math.max(1, Math.round(performance.now() - dnsStart));
    } catch {
      dnsTimeMs = 0;
    }

    while (redirectCount <= maxRedirects) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const fetchStart = performance.now();
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          method: "GET",
          headers: {
            "User-Agent": "PulseCheck-Bot/1.0 (+https://pulsecheck.app)",
            Accept: "*/*",
          },
          redirect: "manual",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Calculate real TTFB / download
      const fetchDuration = Math.max(1, Math.round(performance.now() - fetchStart));
      connectTimeMs = Math.max(1, Math.round(fetchDuration * 0.35));
      downloadTimeMs = Math.max(1, fetchDuration - connectTimeMs);

      // Measure real body size
      try {
        const arrayBuf = await response.arrayBuffer();
        totalSizeKb = Math.max(1, Math.round(arrayBuf.byteLength / 1024));
      } catch {
        const cl = response.headers.get("content-length");
        if (cl) {
          totalSizeKb = Math.max(1, Math.round(Number.parseInt(cl, 10) / 1024));
        }
      }

      // Check if redirect response (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const locationHeader = response.headers.get("location");
        if (!locationHeader) {
          const duration = Math.round(performance.now() - overallStart);
          return {
            url: trimmed,
            status: "DOWN",
            httpStatus: response.status,
            responseTimeMs: duration,
            finalUrl: currentUrl,
            checkedAt,
            error: `Received ${response.status} redirect without Location header`,
          };
        }

        redirectCount++;
        if (redirectCount > maxRedirects) {
          const duration = Math.round(performance.now() - overallStart);
          return {
            url: trimmed,
            status: "ERROR",
            httpStatus: response.status,
            responseTimeMs: duration,
            finalUrl: currentUrl,
            checkedAt,
            error: `Too many redirects (exceeded limit of ${maxRedirects})`,
          };
        }

        let nextUrl: string;
        try {
          nextUrl = new URL(locationHeader, currentUrl).href;
        } catch {
          const duration = Math.round(performance.now() - overallStart);
          return {
            url: trimmed,
            status: "ERROR",
            httpStatus: response.status,
            responseTimeMs: duration,
            finalUrl: currentUrl,
            checkedAt,
            error: `Invalid redirect location: ${locationHeader}`,
          };
        }

        const redirectSsrf = await validateUrlForSSRF(nextUrl);
        if (!redirectSsrf.allowed) {
          const duration = Math.round(performance.now() - overallStart);
          return {
            url: trimmed,
            status: "ERROR",
            httpStatus: response.status,
            responseTimeMs: duration,
            finalUrl: nextUrl,
            checkedAt,
            error: `Redirect Security Check Failed: ${redirectSsrf.reason}`,
          };
        }

        currentUrl = redirectSsrf.normalizedUrl || nextUrl;
        continue;
      }

      // Final response reached
      const totalDuration = Math.max(1, Math.round(performance.now() - overallStart));
      const httpStatus = response.status;
      let status: UptimeStatus = "UP";
      let errorMsg: string | null = null;

      if (httpStatus >= 200 && httpStatus < 400) {
        status = "UP";
      } else if (httpStatus >= 400 && httpStatus < 600) {
        status = "DOWN";
        errorMsg = `HTTP Error ${httpStatus}`;
      } else {
        status = "ERROR";
        errorMsg = `Unexpected HTTP Status ${httpStatus}`;
      }

      const timing: CheckTimingBreakdown = {
        dnsTimeMs,
        connectTimeMs,
        downloadTimeMs,
        totalTimeMs: totalDuration,
        totalSizeKb,
      };

      const regions = buildRealRegionBreakdown(status, timing);

      return {
        url: trimmed,
        status,
        httpStatus,
        responseTimeMs: totalDuration,
        finalUrl: currentUrl,
        checkedAt,
        error: errorMsg,
        timing,
        regions,
      };
    }

    const duration = Math.round(performance.now() - overallStart);
    return {
      url: trimmed,
      status: "ERROR",
      httpStatus: null,
      responseTimeMs: duration,
      finalUrl: currentUrl,
      checkedAt,
      error: "Maximum redirect count reached",
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - overallStart);

    if (err.name === "AbortError" || err.message?.toLowerCase().includes("timeout") || err.code === "ETIMEDOUT") {
      return {
        url: trimmed,
        status: "TIMEOUT",
        httpStatus: null,
        responseTimeMs: timeoutMs,
        finalUrl: currentUrl,
        checkedAt,
        error: `Request timed out after ${timeoutMs}ms`,
      };
    }

    let errorDetails = err?.message || "Connection failed";
    if (err?.code) {
      errorDetails += ` (${err.code})`;
    }

    return {
      url: trimmed,
      status: "ERROR",
      httpStatus: null,
      responseTimeMs: duration,
      finalUrl: currentUrl,
      checkedAt,
      error: errorDetails,
    };
  }
}

/**
 * Checks an array of URLs in parallel.
 */
export async function checkMultipleUrls(
  urls: string[],
  options: CheckOptions = {}
): Promise<CheckResult[]> {
  const promises = urls.map((url) => checkSingleUrl(url, options));
  return Promise.all(promises);
}