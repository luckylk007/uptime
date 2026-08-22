import { describe, it, expect } from "vitest";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  parseAmbiguousIp,
  validateUrlForSSRF,
} from "../../src/lib/ssrf";

describe("Phase 1 Security Check: SSRF IP & DNS Defense", () => {
  describe("IPv4 Validation", () => {
    it("should block 127.0.0.1 (Loopback)", () => {
      expect(isPrivateOrReservedIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.10.20.30")).toBe(true);
    });

    it("should block 10.0.0.0/8 (Private Class A)", () => {
      expect(isPrivateOrReservedIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("10.254.254.254")).toBe(true);
    });

    it("should block 172.16.0.0/12 (Private Class B)", () => {
      expect(isPrivateOrReservedIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.32.0.1")).toBe(false); // Public
    });

    it("should block 192.168.0.0/16 (Private Class C)", () => {
      expect(isPrivateOrReservedIPv4("192.168.1.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.168.100.254")).toBe(true);
    });

    it("should block 169.254.0.0/16 (Link-Local & Cloud Metadata)", () => {
      expect(isPrivateOrReservedIPv4("169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv4("169.254.1.1")).toBe(true);
    });

    it("should block 0.0.0.0 and multicast / broadcast / carrier-grade NAT", () => {
      expect(isPrivateOrReservedIPv4("0.0.0.0")).toBe(true);
      expect(isPrivateOrReservedIPv4("224.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("255.255.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("100.64.0.1")).toBe(true); // CGNAT
    });

    it("should allow public IPv4 addresses", () => {
      expect(isPrivateOrReservedIPv4("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIPv4("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIPv4("142.250.190.46")).toBe(false);
    });
  });

  describe("IPv6 Validation", () => {
    it("should block IPv6 loopback and unspecified addresses", () => {
      expect(isPrivateOrReservedIPv6("::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::")).toBe(true);
      expect(isPrivateOrReservedIPv6("0:0:0:0:0:0:0:1")).toBe(true);
    });

    it("should block unique local and link-local IPv6", () => {
      expect(isPrivateOrReservedIPv6("fc00::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fd12:3456:789a::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fe80::1")).toBe(true);
    });

    it("should block IPv4-mapped IPv6 pointing to private addresses", () => {
      expect(isPrivateOrReservedIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:169.254.169.254")).toBe(true);
    });
  });

  describe("Ambiguous & Encoded IP Parsing", () => {
    it("should detect decimal integer representation of 127.0.0.1 (2130706433)", () => {
      expect(parseAmbiguousIp("2130706433")).toBe("127.0.0.1");
    });

    it("should detect hex representation of 127.0.0.1 (0x7f000001)", () => {
      expect(parseAmbiguousIp("0x7f000001")).toBe("127.0.0.1");
    });

    it("should detect octal notation (0177.0.0.1)", () => {
      expect(parseAmbiguousIp("0177.0.0.1")).toBe("127.0.0.1");
    });
  });

  describe("Full URL SSRF Validator", () => {
    it("should reject localhost URLs", async () => {
      const res = await validateUrlForSSRF("http://localhost:8080/secret");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("blocked");
    });

    it("should reject 127.0.0.1 URLs", async () => {
      const res = await validateUrlForSSRF("http://127.0.0.1/admin");
      expect(res.allowed).toBe(false);
    });

    it("should reject cloud metadata service URLs", async () => {
      const res = await validateUrlForSSRF("http://169.254.169.254/latest/meta-data/");
      expect(res.allowed).toBe(false);
    });

    it("should reject non-HTTP/HTTPS protocols (file://, ftp://, gopher://)", async () => {
      expect((await validateUrlForSSRF("file:///etc/passwd")).allowed).toBe(false);
      expect((await validateUrlForSSRF("ftp://example.com")).allowed).toBe(false);
      expect((await validateUrlForSSRF("gopher://example.com")).allowed).toBe(false);
    });

    it("should reject malformed URLs", async () => {
      expect((await validateUrlForSSRF("http:///")).allowed).toBe(false);
      expect((await validateUrlForSSRF("not a url")).allowed).toBe(false);
    });

    it("should allow legitimate public URLs", async () => {
      const res = await validateUrlForSSRF("https://example.com");
      expect(res.allowed).toBe(true);
      expect(res.normalizedUrl).toBe("https://example.com/");
    });
  });
});