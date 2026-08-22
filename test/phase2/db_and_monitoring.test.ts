import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMonitor,
  listMonitors,
  updateMonitor,
  deleteMonitor,
  recordCheck,
  getChecks,
  getIncidents,
  processStatusTransition,
  processBatchMonitors,
  clearMemoryStore,
  ALLOWED_INTERVALS,
} from "../../src/lib/db";
import * as ssrfModule from "../../src/lib/ssrf";
import * as checkerModule from "../../src/lib/checker";

describe("Phase 2 Functional & Security Checks: Database & Automated Monitoring", () => {
  beforeEach(() => {
    clearMemoryStore();
    vi.restoreAllMocks();
  });

  describe("Monitor CRUD Operations", () => {
    it("should successfully create a monitor for a valid public URL", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      const res = await createMonitor("https://example.com", 5);
      expect(res.error).toBeUndefined();
      expect(res.monitor).toBeDefined();
      expect(res.monitor?.url).toBe("https://example.com/");
      expect(res.monitor?.interval_minutes).toBe(5);
      expect(res.monitor?.enabled).toBe(true);

      const all = await listMonitors();
      expect(all).toHaveLength(1);
    });

    it("should reject monitor creation for invalid intervals", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      const res = await createMonitor("https://example.com", 7);
      expect(res.error).toContain("Invalid interval");
    });

    it("should accept all allowed intervals (5, 10, 15, 30, 60)", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      for (const interval of ALLOWED_INTERVALS) {
        const res = await createMonitor(`https://site-${interval}.com`, interval);
        expect(res.error).toBeUndefined();
        expect(res.monitor?.interval_minutes).toBe(interval);
      }
    });

    it("should block monitor creation with SSRF URLs (localhost, private IP, metadata)", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: false,
        reason: "Access to private/reserved IP 127.0.0.1 is blocked",
      });

      const res = await createMonitor("http://127.0.0.1:8080", 5);
      expect(res.error).toContain("Security Check Failed");

      const all = await listMonitors();
      expect(all).toHaveLength(0);
    });

    it("should pause and resume a monitor (update enabled status)", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      const { monitor } = await createMonitor("https://example.com", 10);
      const id = monitor!.id;

      // Pause
      const paused = await updateMonitor(id, { enabled: false });
      expect(paused.monitor?.enabled).toBe(false);

      // Resume
      const resumed = await updateMonitor(id, { enabled: true });
      expect(resumed.monitor?.enabled).toBe(true);
    });

    it("should delete a monitor and cascade cleanup", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      const { monitor } = await createMonitor("https://example.com", 5);
      const id = monitor!.id;

      await recordCheck({
        monitor_id: id,
        url: "https://example.com/",
        status: "UP",
        http_status: 200,
        response_time_ms: 100,
        final_url: "https://example.com/",
        error: null,
        checked_at: new Date().toISOString(),
      });

      const delRes = await deleteMonitor(id);
      expect(delRes.success).toBe(true);

      const all = await listMonitors();
      expect(all).toHaveLength(0);

      const checks = await getChecks(id);
      expect(checks).toHaveLength(0);
    });
  });

  describe("History & Metrics Calculation", () => {
    it("should calculate uptime percentage and average response time", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://example.com/",
      });

      const { monitor } = await createMonitor("https://example.com", 5);
      const id = monitor!.id;

      // 3 UP checks (100ms, 200ms, 300ms) and 1 DOWN check
      await recordCheck({
        monitor_id: id,
        url: "https://example.com/",
        status: "UP",
        http_status: 200,
        response_time_ms: 100,
        final_url: "https://example.com/",
        error: null,
        checked_at: new Date().toISOString(),
      });
      await recordCheck({
        monitor_id: id,
        url: "https://example.com/",
        status: "UP",
        http_status: 200,
        response_time_ms: 200,
        final_url: "https://example.com/",
        error: null,
        checked_at: new Date().toISOString(),
      });
      await recordCheck({
        monitor_id: id,
        url: "https://example.com/",
        status: "UP",
        http_status: 200,
        response_time_ms: 300,
        final_url: "https://example.com/",
        error: null,
        checked_at: new Date().toISOString(),
      });
      await recordCheck({
        monitor_id: id,
        url: "https://example.com/",
        status: "DOWN",
        http_status: 500,
        response_time_ms: 50,
        final_url: "https://example.com/",
        error: "HTTP 500",
        checked_at: new Date().toISOString(),
      });

      const monitors = await listMonitors();
      const m = monitors.find((x) => x.id === id);

      expect(m).toBeDefined();
      expect(m?.uptime_percentage_24h).toBe(75); // 3 of 4 = 75%
      expect(m?.avg_response_time_24h).toBe(200); // (100+200+300)/3 = 200ms
    });
  });

  describe("Status Change & Incident Lifecycle Detection", () => {
    it("should open an incident on UP -> DOWN transition", async () => {
      const monitorId = "mon-123";
      const url = "https://myservice.com";

      const downResult = {
        url,
        status: "DOWN" as const,
        httpStatus: 503,
        responseTimeMs: 80,
        finalUrl: url,
        checkedAt: "2026-08-22T10:00:00.000Z",
        error: "HTTP Error 503",
      };

      const res = await processStatusTransition(monitorId, url, downResult);
      expect(res.incidentAction).toBe("OPENED");
      expect(res.incident).toBeDefined();
      expect(res.incident?.status).toBe("DOWN");
      expect(res.incident?.cause).toBe("HTTP Error 503");
      expect(res.incident?.resolved_at).toBeNull();

      const openIncidents = await getIncidents(monitorId);
      expect(openIncidents).toHaveLength(1);
    });

    it("should NOT create duplicate incident on consecutive DOWN -> DOWN checks", async () => {
      const monitorId = "mon-123";
      const url = "https://myservice.com";

      const downResult1 = {
        url,
        status: "DOWN" as const,
        httpStatus: 500,
        responseTimeMs: 80,
        finalUrl: url,
        checkedAt: "2026-08-22T10:00:00.000Z",
        error: "HTTP Error 500",
      };

      const downResult2 = {
        url,
        status: "DOWN" as const,
        httpStatus: 500,
        responseTimeMs: 90,
        finalUrl: url,
        checkedAt: "2026-08-22T10:05:00.000Z",
        error: "HTTP Error 500",
      };

      await processStatusTransition(monitorId, url, downResult1);
      const res2 = await processStatusTransition(monitorId, url, downResult2);

      expect(res2.incidentAction).toBe("NONE"); // Deduplicated!

      const allIncidents = await getIncidents(monitorId);
      expect(allIncidents).toHaveLength(1);
    });

    it("should resolve active incident and compute duration on DOWN -> UP transition", async () => {
      const monitorId = "mon-123";
      const url = "https://myservice.com";

      const downResult = {
        url,
        status: "DOWN" as const,
        httpStatus: 500,
        responseTimeMs: 80,
        finalUrl: url,
        checkedAt: "2026-08-22T10:00:00.000Z",
        error: "HTTP Error 500",
      };

      const upResult = {
        url,
        status: "UP" as const,
        httpStatus: 200,
        responseTimeMs: 150,
        finalUrl: url,
        checkedAt: "2026-08-22T10:05:00.000Z", // 5 minutes (300 seconds) later
        error: null,
      };

      await processStatusTransition(monitorId, url, downResult);
      const resolveRes = await processStatusTransition(monitorId, url, upResult);

      expect(resolveRes.incidentAction).toBe("RESOLVED");
      expect(resolveRes.incident?.resolved_at).toBe("2026-08-22T10:05:00.000Z");
      expect(resolveRes.incident?.duration_seconds).toBe(300); // 300s duration

      const incidents = await getIncidents(monitorId);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].resolved_at).not.toBeNull();
    });
  });

  describe("Automated Batch Monitoring Processor", () => {
    it("should process enabled monitors in controlled batches and record checks", async () => {
      vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
        allowed: true,
        normalizedUrl: "https://batch-test.com/",
      });

      await createMonitor("https://batch-test-1.com", 5);
      await createMonitor("https://batch-test-2.com", 5);

      vi.spyOn(checkerModule, "checkSingleUrl").mockResolvedValue({
        url: "https://batch-test.com",
        status: "UP",
        httpStatus: 200,
        responseTimeMs: 95,
        finalUrl: "https://batch-test.com/",
        checkedAt: new Date().toISOString(),
        error: null,
      });

      const batchRes = await processBatchMonitors(10);
      expect(batchRes.processed).toBe(2);
      expect(batchRes.results).toHaveLength(2);

      const checks = await getChecks();
      expect(checks).toHaveLength(2);
    });
  });
});