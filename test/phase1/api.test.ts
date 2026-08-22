import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/check/route";
import { NextRequest } from "next/server";
import * as checkerModule from "../../src/lib/checker";

describe("Phase 1 API Check: POST /api/check", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createMockRequest(body: any, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/check", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  it("should accept valid payload with 1 URL", async () => {
    vi.spyOn(checkerModule, "checkMultipleUrls").mockResolvedValue([
      {
        url: "https://example.com",
        status: "UP",
        httpStatus: 200,
        responseTimeMs: 120,
        finalUrl: "https://example.com/",
        checkedAt: new Date().toISOString(),
        error: null,
      },
    ]);

    const req = createMockRequest({ urls: ["https://example.com"] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.results).toHaveLength(1);
    expect(json.results[0].status).toBe("UP");
  });

  it("should accept valid payload with 5 URLs", async () => {
    vi.spyOn(checkerModule, "checkMultipleUrls").mockResolvedValue(
      Array(5).fill({
        url: "https://example.com",
        status: "UP",
        httpStatus: 200,
        responseTimeMs: 100,
        finalUrl: "https://example.com/",
        checkedAt: new Date().toISOString(),
        error: null,
      })
    );

    const urls = [
      "https://site1.com",
      "https://site2.com",
      "https://site3.com",
      "https://site4.com",
      "https://site5.com",
    ];
    const req = createMockRequest({ urls });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.results).toHaveLength(5);
  });

  it("should reject payload with 6 URLs (> 5 limit)", async () => {
    const urls = [
      "https://site1.com",
      "https://site2.com",
      "https://site3.com",
      "https://site4.com",
      "https://site5.com",
      "https://site6.com",
    ];
    const req = createMockRequest({ urls });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Exceeded maximum of 5 URLs");
  });

  it("should reject empty urls array", async () => {
    const req = createMockRequest({ urls: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("at least 1 URL");
  });

  it("should reject missing urls field", async () => {
    const req = createMockRequest({ invalid: "data" });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Missing required field 'urls'");
  });

  it("should reject non-array urls", async () => {
    const req = createMockRequest({ urls: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should reject oversized request payload (> 16KB)", async () => {
    const req = createMockRequest(
      { urls: ["https://example.com"] },
      { "content-length": "20000" }
    );
    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});