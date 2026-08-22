// Supabase Edge Function: /process-monitors
// Scheduled automated monitoring runner (Cron trigger)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

const BATCH_LIMIT = 10;
const TIMEOUT_MS = 10000;

serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch enabled monitors
  const { data: monitors, error: fetchErr } = await supabase
    .from("monitors")
    .select("*")
    .eq("enabled", true)
    .limit(BATCH_LIMIT);

  if (fetchErr || !monitors) {
    return new Response(JSON.stringify({ error: fetchErr?.message || "Failed to fetch monitors" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = [];

  for (const monitor of monitors) {
    const checkedAt = new Date().toISOString();
    const start = performance.now();
    let status = "UP";
    let httpStatus: number | null = null;
    let errorMsg: string | null = null;
    let finalUrl = monitor.url;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(monitor.url, {
        method: "GET",
        headers: { "User-Agent": "PulseCheck-Bot/1.0 (+https://pulsecheck.app)" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      httpStatus = res.status;
      finalUrl = res.url || monitor.url;
      status = (httpStatus >= 200 && httpStatus < 400) ? "UP" : "DOWN";
      if (status === "DOWN") errorMsg = `HTTP Error ${httpStatus}`;
    } catch (err: any) {
      const isTimeout = err.name === "AbortError";
      status = isTimeout ? "TIMEOUT" : "ERROR";
      errorMsg = isTimeout ? `Timed out after ${TIMEOUT_MS}ms` : err.message;
    }

    const duration = Math.round(performance.now() - start);

    // Save check
    await supabase.from("checks").insert({
      monitor_id: monitor.id,
      url: monitor.url,
      status,
      http_status: httpStatus,
      response_time_ms: duration,
      final_url: finalUrl,
      error: errorMsg,
      checked_at: checkedAt,
    });

    results.push({ monitor_id: monitor.id, status, httpStatus, duration });
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: results.length,
      timestamp: new Date().toISOString(),
      results,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});