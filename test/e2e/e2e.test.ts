import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as checkPost } from "../../src/app/api/check/route";
import { GET as monitorsGet, POST as monitorsPost } from "../../src/app/api/monitors/route";
import { GET as monitorHistoryGet } from "../../src/app/api/monitors/[id]/history/route";
import { POST as cronPost } from "../../src/app/api/cron/process-monitors/route";
import { NextRequest } from "next/server";
import { clearMemoryStore } from "../../src/lib/db";
import * as ssrfModule from "../../src/lib/ssrf";
import { signToken } from "../../src/lib/jwt";

// Set JWT_SECRET for tests
process.env.JWT_SECRET = "test-secret-for-e2e-tests-at-least-32-chars-long";

const TEST_USER_ID = "test-user";
const TEST_USER_EMAIL = "test@example.com";

describe("Phase 3 Final Production End-to-End System Test", () => {
  beforeEach(() => {
    clearMemoryStore();
    vi.restoreAllMocks();
  });

  function getAuthCookie(): string {
    const token = signToken({ userId: TEST_USER_ID, email: TEST_USER_EMAIL });
    return `uptimepro_token=${token}`;
  }

  function createRequest(url: string, method: string, body?: any, headers: Record<string, string> = {}) {
    return new NextRequest(url, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function createAuthRequest(url: string, method: string, body?: any) {
    return new NextRequest(url, {
      method,
      headers: {
        "content-type": "application/json",
        cookie: getAuthCookie(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }


  it("1. Single URL Check flow (1 URL)", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://google.com/",
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://google.com"],
    });

    const res = await checkPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(1);
    expect(json.results[0].status).toBe("UP");
    expect(json.results[0].httpStatus).toBe(200);
  });

  it("2. Two URLs Check flow", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://example.com/",
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://example.com", "https://example.org"],
    });

    const res = await checkPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(2);
  });

  it("3. Five URLs Check flow (Exact limit)", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://example.com/",
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: [
        "https://site1.com",
        "https://site2.com",
        "https://site3.com",
        "https://site4.com",
        "https://site5.com",
      ],
    });

    const res = await checkPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(5);
  });

  it("4. Invalid URL Check flow (Rejection of malformed / bad protocols)", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: false,
      reason: "Malformed URL format",
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["invalid-url-string"],
    });

    const res = await checkPost(req);
    const json = await res.json();
    expect(json.results[0].status).toBe("ERROR");
    expect(json.results[0].error).toContain("Malformed");
  });

  it("5. Down website flow (HTTP 500 / 404 status)", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://broken-site.com/",
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 503,
      headers: new Headers(),
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://broken-site.com"],
    });

    const res = await checkPost(req);
    const json = await res.json();
    expect(json.results[0].status).toBe("DOWN");
    expect(json.results[0].httpStatus).toBe(503);
  });

  it("6. Timeout handling flow", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://slow-site.com/",
    });

    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://slow-site.com"],
    });

    const res = await checkPost(req);
    const json = await res.json();
    expect(json.results[0].status).toBe("TIMEOUT");
    expect(json.results[0].httpStatus).toBeNull();
  });

  it("7. Redirect flow with re-validation", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (u: string) => ({
      allowed: true,
      normalizedUrl: u,
    }));

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        status: 301,
        headers: new Headers({ location: "https://target-final.com" }),
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
      });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://initial.com"],
    });

    const res = await checkPost(req);
    const json = await res.json();
    expect(json.results[0].status).toBe("UP");
    expect(json.results[0].finalUrl).toBe("https://target-final.com/");
  });

  it("8. DNS failure flow", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: false,
      reason: "DNS resolution failed for hostname unknown.domain",
    });

    const req = createRequest("http://localhost:3000/api/check", "POST", {
      urls: ["https://unknown.domain"],
    });

    const res = await checkPost(req);
    const json = await res.json();
    expect(json.results[0].status).toBe("ERROR");
    expect(json.results[0].error).toContain("DNS resolution failed");
  });

  it("9. Concurrent requests flow", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://example.com/",
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const promises = Array(5)
      .fill(0)
      .map(() => {
        const req = createRequest("http://localhost:3000/api/check", "POST", {
          urls: ["https://example.com"],
        });
        return checkPost(req);
      });

    const responses = await Promise.all(promises);
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it("10. Full End-to-End: Monitor Creation -> Cron Batch Probe -> History Retrieval", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: true,
      normalizedUrl: "https://e2e-monitored.com/",
    });

    // Step A: Create Monitor (authenticated)
    const createReq = createAuthRequest("http://localhost:3000/api/monitors", "POST", {
      url: "https://e2e-monitored.com",
      interval_minutes: 5,
    });
    const createRes = await monitorsPost(createReq);
    expect(createRes.status).toBe(201);
    const createdData = await createRes.json();
    const monitorId = createdData.monitor.id;

    // Step B: Run Cron Automated Check
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const cronReq = createRequest("http://localhost:3000/api/cron/process-monitors", "POST");
    const cronRes = await cronPost(cronReq);
    expect(cronRes.status).toBe(200);
    const cronData = await cronRes.json();
    expect(cronData.processed).toBe(1);

    // Step C: Retrieve Monitor History (authenticated)
    const historyReq = createAuthRequest(`http://localhost:3000/api/monitors/${monitorId}/history`, "GET");
    const historyRes = await monitorHistoryGet(historyReq, { params: Promise.resolve({ id: monitorId }) });
    expect(historyRes.status).toBe(200);
    const historyData = await historyRes.json();
    expect(historyData.checks).toHaveLength(1);
    expect(historyData.checks[0].status).toBe("UP");

    // Step D: Verify Monitor in List (authenticated)
    const listReq = createAuthRequest("http://localhost:3000/api/monitors", "GET");
    const listRes = await monitorsGet(listReq);
    const listData = await listRes.json();
    expect(listData.monitors).toHaveLength(1);
    expect(listData.monitors[0].uptime_percentage_24h).toBe(100);
  });
});