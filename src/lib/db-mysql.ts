import { query, queryOne } from "./mysql";
import { validateUrlForSSRF } from "./ssrf";
import { checkSingleUrl } from "./checker";
import type { Monitor, DbCheck, Incident, CheckResult } from "./types";
import crypto from "node:crypto";

export const ALLOWED_INTERVALS = [5, 10, 15, 30, 60] as const;
const MAX_MONITORS_PER_USER = 5;

function uuid(): string {
  return crypto.randomUUID();
}

// --- In-Memory fallback (used when MySQL not configured) ---------------------
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

function isMySQLConfigured(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
    process.env.MYSQL_USER &&
    process.env.MYSQL_PASSWORD &&
    process.env.MYSQL_DATABASE
  );
}

// --- CREATE MONITOR ----------------------------------------------------------
export async function createMonitor(
  url: string,
  intervalMinutes: number = 5,
  userId: string
): Promise<{ monitor?: Monitor; error?: string }> {
  const trimmedUrl = (url || "").trim();
  if (!trimmedUrl) return { error: "URL cannot be empty" };

  if (!ALLOWED_INTERVALS.includes(intervalMinutes as any)) {
    return { error: `Invalid interval. Allowed: ${ALLOWED_INTERVALS.join(", ")} minutes` };
  }

  if (!userId) return { error: "Authentication required to create a monitor" };

  const ssrf = await validateUrlForSSRF(trimmedUrl);
  if (!ssrf.allowed) return { error: `Security Check Failed: ${ssrf.reason}` };

  const normalizedUrl = ssrf.normalizedUrl || trimmedUrl;

  if (isMySQLConfigured()) {
    // Check quota with parameterized query � userId comes from JWT, not client
    const countRows = await query<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM monitors WHERE user_id = ?",
      [userId]
    );
    const count = countRows[0]?.cnt ?? 0;
    if (count >= MAX_MONITORS_PER_USER) {
      return { error: `Monitor limit reached. Maximum ${MAX_MONITORS_PER_USER} monitors allowed.` };
    }

    const id = uuid();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await query(
      "INSERT INTO monitors (id, user_id, url, interval_minutes, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
      [id, userId, normalizedUrl, intervalMinutes, now, now]
    );

    const monitor = await queryOne<any>("SELECT * FROM monitors WHERE id = ?", [id]);
    return { monitor: rowToMonitor(monitor) };
  }

  // In-Memory fallback
  const existing = Array.from(memoryStore.monitors.values()).filter(m => m.user_id === userId);
  if (existing.length >= MAX_MONITORS_PER_USER) {
    return { error: `Monitor limit reached. Maximum ${MAX_MONITORS_PER_USER} monitors allowed.` };
  }

  const newMonitor: Monitor = {
    id: uuid(),
    user_id: userId,
    url: normalizedUrl,
    interval_minutes: intervalMinutes,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.monitors.set(newMonitor.id, newMonitor);
  return { monitor: newMonitor };
}

// --- LIST MONITORS -----------------------------------------------------------
export async function listMonitors(userId: string): Promise<Monitor[]> {
  let rawMonitors: Monitor[] = [];

  if (isMySQLConfigured()) {
    // Only return monitors belonging to this user � no cross-user leakage
    const rows = await query<any>(
      "SELECT * FROM monitors WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    rawMonitors = rows.map(rowToMonitor);
  } else {
    rawMonitors = Array.from(memoryStore.monitors.values())
      .filter(m => m.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Enrich with recent check metrics
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
        const upChecks = checks.filter(c => c.status === "UP");
        uptimePct = Number(((upChecks.length / checks.length) * 100).toFixed(1));
        const validLatencies = upChecks.map(c => c.response_time_ms);
        if (validLatencies.length > 0) {
          avgResponseTime = Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length);
        }
      }

      return { ...m, last_check: lastCheck, uptime_percentage_24h: uptimePct, avg_response_time_24h: avgResponseTime };
    })
  );

  return enriched;
}

// --- GET MONITOR BY ID (with ownership check) --------------------------------
export async function getMonitorById(id: string, userId: string): Promise<Monitor | null> {
  if (isMySQLConfigured()) {
    const row = await queryOne<any>(
      "SELECT * FROM monitors WHERE id = ? AND user_id = ?",
      [id, userId]  // ownership enforced in SQL � prevents IDOR
    );
    return row ? rowToMonitor(row) : null;
  }

  const m = memoryStore.monitors.get(id);
  return m && m.user_id === userId ? m : null;
}

// --- UPDATE MONITOR -----------------------------------------------------------
export async function updateMonitor(
  id: string,
  userId: string,
  updates: { enabled?: boolean; interval_minutes?: number }
): Promise<{ monitor?: Monitor; error?: string }> {
  if (updates.interval_minutes !== undefined && !ALLOWED_INTERVALS.includes(updates.interval_minutes as any)) {
    return { error: `Invalid interval. Allowed: ${ALLOWED_INTERVALS.join(", ")} minutes` };
  }

  // Verify ownership before modifying
  const existing = await getMonitorById(id, userId);
  if (!existing) return { error: "Monitor not found or access denied" };

  if (isMySQLConfigured()) {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const setParts: string[] = ["updated_at = ?"];
    const values: any[] = [now];

    if (updates.enabled !== undefined) { setParts.push("enabled = ?"); values.push(updates.enabled ? 1 : 0); }
    if (updates.interval_minutes !== undefined) { setParts.push("interval_minutes = ?"); values.push(updates.interval_minutes); }

    values.push(id, userId);
    await query(
      `UPDATE monitors SET ${setParts.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    const updated = await getMonitorById(id, userId);
    return { monitor: updated ?? undefined };
  }

  const updated: Monitor = { ...existing, ...updates, updated_at: new Date().toISOString() };
  memoryStore.monitors.set(id, updated);
  return { monitor: updated };
}

// --- DELETE MONITOR -----------------------------------------------------------
export async function deleteMonitor(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const existing = await getMonitorById(id, userId);
  if (!existing) return { success: false, error: "Monitor not found or access denied" };

  if (isMySQLConfigured()) {
    await query("DELETE FROM monitors WHERE id = ? AND user_id = ?", [id, userId]);
    return { success: true };
  }

  memoryStore.monitors.delete(id);
  memoryStore.checks = memoryStore.checks.filter(c => c.monitor_id !== id);
  memoryStore.incidents = memoryStore.incidents.filter(i => i.monitor_id !== id);
  return { success: true };
}

// --- RECORD CHECK -------------------------------------------------------------
export async function recordCheck(check: DbCheck): Promise<DbCheck> {
  const record: DbCheck = {
    ...check,
    id: check.id || uuid(),
    checked_at: check.checked_at || new Date().toISOString(),
  };

  if (isMySQLConfigured()) {
    const at = new Date(record.checked_at).toISOString().slice(0, 19).replace("T", " ");
    await query(
      "INSERT INTO checks_log (id, monitor_id, url, status, http_status, response_time_ms, final_url, error, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [record.id, record.monitor_id ?? null, record.url, record.status, record.http_status ?? null, record.response_time_ms, record.final_url, record.error ?? null, at]
    );
  } else {
    memoryStore.checks.unshift(record);
  }

  return record;
}

// --- GET CHECKS --------------------------------------------------------------
export async function getChecks(monitorId?: string, limit: number = 30): Promise<DbCheck[]> {
  if (isMySQLConfigured()) {
    if (monitorId) {
      const rows = await query<any>(
        "SELECT * FROM checks_log WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?",
        [monitorId, limit]
      );
      return rows.map(rowToCheck);
    }
    const rows = await query<any>("SELECT * FROM checks_log ORDER BY checked_at DESC LIMIT ?", [limit]);
    return rows.map(rowToCheck);
  }

  let filtered = memoryStore.checks;
  if (monitorId) filtered = filtered.filter(c => c.monitor_id === monitorId);
  return filtered.slice(0, limit);
}

// --- GET INCIDENTS ------------------------------------------------------------
export async function getIncidents(monitorId?: string, limit: number = 20): Promise<Incident[]> {
  if (isMySQLConfigured()) {
    if (monitorId) {
      const rows = await query<any>(
        "SELECT * FROM incidents WHERE monitor_id = ? ORDER BY started_at DESC LIMIT ?",
        [monitorId, limit]
      );
      return rows.map(rowToIncident);
    }
    const rows = await query<any>("SELECT * FROM incidents ORDER BY started_at DESC LIMIT ?", [limit]);
    return rows.map(rowToIncident);
  }

  let filtered = memoryStore.incidents;
  if (monitorId) filtered = filtered.filter(i => i.monitor_id === monitorId);
  return filtered.slice(0, limit);
}

// --- PROCESS STATUS TRANSITION -----------------------------------------------
export async function processStatusTransition(
  monitorId: string,
  url: string,
  currentResult: CheckResult
): Promise<{ incidentAction: "NONE" | "OPENED" | "RESOLVED"; incident?: Incident }> {
  let openIncident: Incident | null = null;

  if (isMySQLConfigured()) {
    const row = await queryOne<any>(
      "SELECT * FROM incidents WHERE monitor_id = ? AND resolved_at IS NULL ORDER BY started_at DESC LIMIT 1",
      [monitorId]
    );
    if (row) openIncident = rowToIncident(row);
  } else {
    openIncident = memoryStore.incidents.find(i => i.monitor_id === monitorId && !i.resolved_at) || null;
  }

  const isDown = ["DOWN", "TIMEOUT", "ERROR"].includes(currentResult.status);

  if (isDown && !openIncident) {
    const newIncident: Incident = {
      id: uuid(),
      monitor_id: monitorId,
      url,
      status: "DOWN",
      cause: currentResult.error || `HTTP ${currentResult.httpStatus || "error"}`,
      started_at: currentResult.checkedAt,
      resolved_at: null,
      duration_seconds: null,
    };

    if (isMySQLConfigured()) {
      const at = new Date(newIncident.started_at).toISOString().slice(0, 19).replace("T", " ");
      await query(
        "INSERT INTO incidents (id, monitor_id, url, status, cause, started_at) VALUES (?, ?, ?, ?, ?, ?)",
        [newIncident.id, newIncident.monitor_id, newIncident.url, newIncident.status, newIncident.cause, at]
      );
    } else {
      memoryStore.incidents.unshift(newIncident);
    }
    return { incidentAction: "OPENED", incident: newIncident };
  }

  if (isDown) return { incidentAction: "NONE", incident: openIncident ?? undefined };

  if (currentResult.status === "UP" && openIncident) {
    const durationSeconds = Math.max(1, Math.round(
      (new Date(currentResult.checkedAt).getTime() - new Date(openIncident.started_at).getTime()) / 1000
    ));
    const resolvedAt = currentResult.checkedAt;

    if (isMySQLConfigured()) {
      const atStr = new Date(resolvedAt).toISOString().slice(0, 19).replace("T", " ");
      await query(
        "UPDATE incidents SET resolved_at = ?, duration_seconds = ? WHERE id = ?",
        [atStr, durationSeconds, openIncident.id]
      );
    } else {
      const idx = memoryStore.incidents.findIndex(i => i.id === openIncident?.id);
      if (idx !== -1) {
        memoryStore.incidents[idx] = { ...openIncident, resolved_at: resolvedAt, duration_seconds: durationSeconds };
      }
    }
    return { incidentAction: "RESOLVED", incident: { ...openIncident, resolved_at: resolvedAt, duration_seconds: durationSeconds } };
  }

  return { incidentAction: "NONE" };
}

// --- BATCH CRON PROCESSOR -----------------------------------------------------
export async function processBatchMonitors(batchLimit: number = 10): Promise<{
  processed: number;
  results: Array<{ monitorId: string; result: CheckResult }>;
}> {
  let allMonitors: Monitor[] = [];

  if (isMySQLConfigured()) {
    const rows = await query<any>(
      "SELECT * FROM monitors WHERE enabled = 1 ORDER BY created_at ASC LIMIT ?",
      [batchLimit]
    );
    allMonitors = rows.map(rowToMonitor);
  } else {
    allMonitors = Array.from(memoryStore.monitors.values())
      .filter(m => m.enabled)
      .slice(0, batchLimit);
  }

  const results: Array<{ monitorId: string; result: CheckResult }> = [];

  for (const monitor of allMonitors) {
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

  return { processed: results.length, results };
}

// --- Row Mappers --------------------------------------------------------------
function rowToMonitor(row: any): Monitor {
  return {
    id: row.id,
    user_id: row.user_id,
    url: row.url,
    interval_minutes: row.interval_minutes,
    enabled: Boolean(row.enabled),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function rowToCheck(row: any): DbCheck {
  return {
    id: row.id,
    monitor_id: row.monitor_id,
    url: row.url,
    status: row.status,
    http_status: row.http_status,
    response_time_ms: row.response_time_ms,
    final_url: row.final_url,
    error: row.error,
    checked_at: row.checked_at instanceof Date ? row.checked_at.toISOString() : String(row.checked_at),
  };
}

function rowToIncident(row: any): Incident {
  return {
    id: row.id,
    monitor_id: row.monitor_id,
    url: row.url,
    status: row.status,
    cause: row.cause,
    started_at: row.started_at instanceof Date ? row.started_at.toISOString() : String(row.started_at),
    resolved_at: row.resolved_at ? (row.resolved_at instanceof Date ? row.resolved_at.toISOString() : String(row.resolved_at)) : null,
    duration_seconds: row.duration_seconds,
  };
}
