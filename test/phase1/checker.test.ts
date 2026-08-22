import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSingleUrl, checkMultipleUrls } from "../../src/lib/checker";
import * as ssrfModule from "../../src/lib/ssrf";

describe("Phase 1 Functional Check: Uptime Checker Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return UP for HTTP 200 responses", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const result = await checkSingleUrl("https://example.com");
    expect(result.status).toBe("UP");
    expect(result.httpStatus).toBe(200);
    expect(result.error).toBeNull();
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("should follow 301/302 redirects and validate each hop", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        status: 301,
        headers: new Headers({ location: "https://example.com/final" }),
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
      });

    global.fetch = mockFetch;

    const result = await checkSingleUrl("https://example.com/initial");
    expect(result.status).toBe("UP");
    expect(result.httpStatus).toBe(200);
    expect(result.finalUrl).toBe("https://example.com/final");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should block redirects attempting SSRF to private IP", async () => {
    let callCount = 0;
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        return { allowed: true, normalizedUrl: url };
      }
      return { allowed: false, reason: "Resolves to private IP 10.0.0.1" };
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 302,
      headers: new Headers({ location: "http://10.0.0.1/admin" }),
    });

    const result = await checkSingleUrl("https://example.com");
    expect(result.status).toBe("ERROR");
    expect(result.error).toContain("Redirect Security Check Failed");
  });

  it("should return DOWN for HTTP 404 responses", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      headers: new Headers(),
    });

    const result = await checkSingleUrl("https://example.com/nonexistent");
    expect(result.status).toBe("DOWN");
    expect(result.httpStatus).toBe(404);
    expect(result.error).toContain("404");
  });

  it("should return DOWN for HTTP 500 server errors", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      status: 500,
      headers: new Headers(),
    });

    const result = await checkSingleUrl("https://example.com/server-error");
    expect(result.status).toBe("DOWN");
    expect(result.httpStatus).toBe(500);
    expect(result.error).toContain("500");
  });

  it("should return TIMEOUT when request exceeds time limit", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const result = await checkSingleUrl("https://example.com/slow", { timeoutMs: 50 });
    expect(result.status).toBe("TIMEOUT");
    expect(result.httpStatus).toBeNull();
    expect(result.error).toContain("timed out");
  });

  it("should return ERROR on DNS/connection failure", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockResolvedValue({
      allowed: false,
      reason: "DNS lookup failed: getaddrinfo ENOTFOUND invalid-domain-xyz.test",
    });

    const result = await checkSingleUrl("https://invalid-domain-xyz.test");
    expect(result.status).toBe("ERROR");
    expect(result.httpStatus).toBeNull();
    expect(result.error).toContain("Security Check Failed");
  });

  it("should process up to 5 URLs in parallel", async () => {
    vi.spyOn(ssrfModule, "validateUrlForSSRF").mockImplementation(async (url: string) => ({
      allowed: true,
      normalizedUrl: url,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
    });

    const urls = [
      "https://example1.com",
      "https://example2.com",
      "https://example3.com",
      "https://example4.com",
      "https://example5.com",
    ];

    const results = await checkMultipleUrls(urls);
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r.status).toBe("UP");
      expect(r.httpStatus).toBe(200);
    });
  });
});