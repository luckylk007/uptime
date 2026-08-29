/**
 * db.ts � Compatibility re-export for tests and legacy callers.
 *
 * The real implementation is in db-mysql.ts which uses MySQL.
 * This file re-exports everything, but adapts function signatures
 * that changed during migration (userId is now required for monitors).
 *
 * Tests use in-memory fallback (no MySQL configured in test env).
 */

export {
  ALLOWED_INTERVALS,
  clearMemoryStore,
  recordCheck,
  getChecks,
  getIncidents,
  processStatusTransition,
  processBatchMonitors,
} from "./db-mysql";

import {
  createMonitor as _createMonitor,
  listMonitors as _listMonitors,
  updateMonitor as _updateMonitor,
  deleteMonitor as _deleteMonitor,
} from "./db-mysql";
import type { Monitor } from "./types";

/**
 * Legacy-compatible createMonitor � userId defaults to a test user ID.
 * In production, always pass userId from JWT.
 */
export async function createMonitor(
  url: string,
  intervalMinutes: number = 5,
  userId?: string | null
): Promise<{ monitor?: Monitor; error?: string }> {
  return _createMonitor(url, intervalMinutes, userId || "test-user");
}

/**
 * Legacy-compatible listMonitors � returns all monitors for test user if no userId given.
 */
export async function listMonitors(userId?: string | null): Promise<Monitor[]> {
  return _listMonitors(userId || "test-user");
}

/**
 * Legacy-compatible updateMonitor � userId defaults to test user.
 */
export async function updateMonitor(
  id: string,
  updates: { enabled?: boolean; interval_minutes?: number },
  userId?: string | null
): Promise<{ monitor?: Monitor; error?: string }> {
  return _updateMonitor(id, userId || "test-user", updates);
}

/**
 * Legacy-compatible deleteMonitor � userId defaults to test user.
 */
export async function deleteMonitor(
  id: string,
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  return _deleteMonitor(id, userId || "test-user");
}
