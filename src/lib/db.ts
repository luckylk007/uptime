import { getSupabaseClient, getSupabaseAdminClient } from "./supabase";
import { validateUrlForSSRF } from "./ssrf";
import { checkSingleUrl } from "./checker";
import type { Monitor, DbCheck, Incident, CheckResult } from "./types";
import crypto from "node:crypto";

export const ALLOWED_INTERVALS = [5, 10, 15, 30, 60] as const;
const MAX_MONITORS_PER_USER = 5;

// In-Memory store for tests and fallback
interface MemoryStore {
  monitors: Map<string, Monitor>;
  checks: DbCheck[];
  incidents: Incident[];
}

const memoryStore: MemoryStore = {
  monitors: new Map(),
  checks: [],
  incidents: [],
};

export function clearMemoryStore() {
  memoryStore.monitors.clear();
  memoryStore.checks = [];
  memoryStore.incidents = [];
}

function getClient() {
  return getSupabaseAdminClient() || getSupabaseClient();
}

/**
 * Creates a new website monitor with SSRF check, interval check, and max 5 quota per user.
 */
export async function createMonitor(
  url: string,
  intervalMinutes: number = 5,
  userId?: string | null
): Promise<{ monitor?: Monitor; error?: string }> {
  const trimmedUrl = (url || "").trim();
  if (!trimmedUrl) {
    return { error: "URL cannot be empty" };
  }

  if (!ALLOWED_INTERVALS.includes(intervalMinutes as any)) {
    return {
      error: `Invalid interval. Allowed intervals are: ${ALLOWED_INTERVALS.join(", ")} minutes`,
    };
  }

  // Strict SSRF check before registering monitor
  const ssrf = await validateUrlForSSRF(trimmedUrl);
  if (!ssrf.allowed) {
    return { error: `Security Check Failed: ${ssrf.reason}` };
  }

  const normalizedUrl = ssrf.normalizedUrl || trimmedUrl;

  const client = getClient();
  if (client) {
    // Check 5 monitor quota
    let countQuery = client.from("monitors").select("id", { count: "exact" });
    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }
    const { count, error: countErr } = await countQuery;
    if (!countErr && (count ?? 0) >= MAX_MONITORS_PER_USER) {
      return {
        error: `Monitor limit reached. You can create a maximum of ${MAX_MONITORS_PER_USER} monitors.`,
      };
    }

    const { data, error } = await client
      .from("monitors")
      .insert({
        url: normalizedUrl,
        interval_minutes: intervalMinutes,
        enabled: true,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { monitor: data as Monitor };
  }

  // Fallback / In-Memory
  const existingUserMonitors = Array.from(memoryStore.monitors.values()).filter(
    (m) => (userId ? m.user_id === userId : true)
  );

  if (existingUserMonitors.length >= MAX_MONITORS_PER_USER) {
    return {
      error: `Monitor limit reached. You can create a maximum of ${MAX_MONITORS_PER_USER} monitors.`,
    };
  }

  const newMonitor: Monitor = {
    id: crypto.randomUUID(),
    user_id: userId || null,
    url: normalizedUrl,
    interval_minutes: intervalMinutes,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.monitors.set(newMonitor.id, newMonitor);
  return { monitor: newMonitor };
}

/**
 * Lists monitors for a specific user or all monitors.
 */
export async function listMonitors(userId?: string | null): Promise<Monitor[]> {
  const client = getClient();
  let rawMonitors: Monitor[] = [];

  if (client) {
    let query = client
      .from("monitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (!error && data) {
      rawMonitors = data as Monitor[];
    }
  } else {
    rawMonitors = Array.from(memoryStore.monitors.values())
      .filter((m) => (userId ? m.user_id === userId : true))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Enrich each monitor with recent checks and metrics
  const enriched: Monitor[] = await Promise.all(
    rawMonitors.map(async (m) => {
      const checks = await getChecks(m.id, 30);
      const lastCheck = checks[0]
        ? {
            url: checks[0].url,
            status: checks[0].status,
            httpStatus: checks[0].http_status,
            responseTimeMs: checks[0].response_time_ms,
            finalUrl: checks[0].final_url,
            checkedAt: checks[0].checked_at,
            error: checks[0].error,
          }
        : null;

      let uptimePct = 100;
      let avgResponseTime = 0;

      if (checks.length > 0) {
        const upChecks = checks.filter((c) => c.status === "UP");
        uptimePct = Number(((upChecks.length / checks.length) * 100).toFixed(1));

        const validLatencies = upChecks.map((c) => c.response_time_ms);
        if (validLatencies.length > 0) {
          avgResponseTime = Math.round(
            validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
          );
        }
      }

      return {
        ...m,
        last_check: lastCheck,
        uptime_percentage_24h: uptimePct,
        avg_response_time_24h: avgResponseTime,
      };
    })
  );

  return enriched;
}

/**
 * Updates a monitor's enabled status or interval.
 */
export async function updateMonitor(
  id: string,
  updates: { enabled?: boolean; interval_minutes?: number }
): Promise<{ monitor?: Monitor; error?: string }> {
  if (
    updates.interval_minutes !== undefined &&
    !ALLOWED_INTERVALS.includes(updates.interval_minutes as any)
  ) {
    return {
      error: `Invalid interval. Allowed: ${ALLOWED_INTERVALS.join(", ")} minutes`,
    };
  }

  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from("monitors")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: error.message };
    return { monitor: data as Monitor };
  }

  const existing = memoryStore.monitors.get(id);
  if (!existing) return { error: "Monitor not found" };

  const updated: Monitor = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  memoryStore.monitors.set(id, updated);
  return { monitor: updated };
}

/**
 * Deletes a monitor.
 */
export async function deleteMonitor(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getClient();
  if (client) {
    const { error } = await client.from("monitors").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const deleted = memoryStore.monitors.delete(id);
  memoryStore.checks = memoryStore.checks.filter((c) => c.monitor_id !== id);
  memoryStore.incidents = memoryStore.incidents.filter((i) => i.monitor_id !== id);
  return { success: deleted };
}

/**
 * Records a check execution.
 */
export async function recordCheck(check: DbCheck): Promise<DbCheck> {
  const record: DbCheck = {
    ...check,
    id: check.id || crypto.randomUUID(),
    checked_at: check.checked_at || new Date().toISOString(),
  };

  const client = getClient();
  if (client) {
    await client.from("checks").insert(record);
  } else {
    memoryStore.checks.unshift(record);
  }

  return record;
}

/**
 * Retrieves check history for a monitor.
 */
export async function getChecks(monitorId?: string, limit: number = 30): Promise<DbCheck[]> {
  const client = getClient();
  if (client) {
    let query = client
      .from("checks")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(limit);

    if (monitorId) {
      query = query.eq("monitor_id", monitorId);
    }

    const { data, error } = await query;
    if (!error && data) return data as DbCheck[];
  }

  let filtered = memoryStore.checks;
  if (monitorId) {
    filtered = filtered.filter((c) => c.monitor_id === monitorId);
  }
  return filtered.slice(0, limit);
}

/**
 * Retrieves incidents.
 */
export async function getIncidents(monitorId?: string, limit: number = 20): Promise<Incident[]> {
  const client = getClient();
  if (client) {
    let query = client
      .from("incidents")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (monitorId) {
      query = query.eq("monitor_id", monitorId);
    }

    const { data, error } = await query;
    if (!error && data) return data as Incident[];
  }

  let filtered = memoryStore.incidents;
  if (monitorId) {
    filtered = filtered.filter((i) => i.monitor_id === monitorId);
  }
  return filtered.slice(0, limit);
}

/**
 * Handles status transitions and manages incident deduplication.
 */
export async function processStatusTransition(
  monitorId: string,
  url: string,
  currentResult: CheckResult
): Promise<{ incidentAction: "NONE" | "OPENED" | "RESOLVED"; incident?: Incident }> {
  const client = getClient();
  let openIncident: Incident | null = null;

  if (client) {
    const { data } = await client
      .from("incidents")
      .select("*")
      .eq("monitor_id", monitorId)
      .is("resolved_at", null)
      .order("started_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      openIncident = data[0] as Incident;
    }
  } else {
    openIncident =
      memoryStore.incidents.find((i) => i.monitor_id === monitorId && !i.resolved_at) || null;
  }

  const isDown =
    currentResult.status === "DOWN" ||
    currentResult.status === "TIMEOUT" ||
    currentResult.status === "ERROR";

  if (isDown) {
    if (!openIncident) {
      const newIncident: Incident = {
        id: crypto.randomUUID(),
        monitor_id: monitorId,
        url,
        status: "DOWN",
        cause: currentResult.error || `Received HTTP ${currentResult.httpStatus || "error"}`,
        started_at: currentResult.checkedAt,
        resolved_at: null,
        duration_seconds: null,
      };

      if (client) {
        await client.from("incidents").insert(newIncident);
      } else {
        memoryStore.incidents.unshift(newIncident);
      }

      return { incidentAction: "OPENED", incident: newIncident };
    }
    return { incidentAction: "NONE", incident: openIncident };
  }

  if (currentResult.status === "UP" && openIncident) {
    const startTime = new Date(openIncident.started_at).getTime();
    const endTime = new Date(currentResult.checkedAt).getTime();
    const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

    const resolvedIncident: Incident = {
      ...openIncident,
      resolved_at: currentResult.checkedAt,
      duration_seconds: durationSeconds,
    };

    if (client) {
      await client
        .from("incidents")
        .update({
          resolved_at: resolvedIncident.resolved_at,
          duration_seconds: resolvedIncident.duration_seconds,
        })
        .eq("id", openIncident.id);
    } else {
      const idx = memoryStore.incidents.findIndex((i) => i.id === openIncident?.id);
      if (idx !== -1) {
        memoryStore.incidents[idx] = resolvedIncident;
      }
    }

    return { incidentAction: "RESOLVED", incident: resolvedIncident };
  }

  return { incidentAction: "NONE" };
}

/**
 * Scheduled monitor processor (cron execution with batch limit).
 */
export async function processBatchMonitors(batchLimit: number = 10): Promise<{
  processed: number;
  results: Array<{ monitorId: string; result: CheckResult }>;
}> {
  const allMonitors = await listMonitors();
  const enabledMonitors = allMonitors.filter((m) => m.enabled).slice(0, batchLimit);

  const results: Array<{ monitorId: string; result: CheckResult }> = [];

  for (const monitor of enabledMonitors) {
    const result = await checkSingleUrl(monitor.url);

    await recordCheck({
      monitor_id: monitor.id,
      url: monitor.url,
      status: result.status,
      http_status: result.httpStatus,
      response_time_ms: result.responseTimeMs,
      final_url: result.finalUrl,
      error: result.error,
      checked_at: result.checkedAt,
    });

    await processStatusTransition(monitor.id, monitor.url, result);
    results.push({ monitorId: monitor.id, result });
  }

  return {
    processed: results.length,
    results,
  };
}