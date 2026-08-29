import dns from "node:dns/promises";
import net from "node:net";

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
  normalizedUrl?: string;
  resolvedIps?: string[];
}

/**
 * Checks if an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(p => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid -> reject
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local / Cloud Metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, link-local, or reserved range.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback (::1) & Unspecified (::)
  if (normalized === "::1" || normalized === "::" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  // IPv4-mapped IPv6 address (::ffff:127.0.0.1, etc.)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const ipv4Part = normalized.replace(/^.*:/, "");
    if (net.isIPv4(ipv4Part)) {
      return isPrivateOrReservedIPv4(ipv4Part);
    }
    return true;
  }

  // Unique Local Address (fc00::/7 -> fc00:: to fdff::)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  // Link-Local (fe80::/10)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith("ff")) {
    return true;
  }

  // Discard prefix / Documentation (100::/64, 2001:db8::/32)
  if (normalized.startsWith("100:") || normalized.startsWith("2001:db8")) {
    return true;
  }

  return false;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "local",
  "internal",
  "router.asus.com",
  "fritz.box",
  "setup.amplifi.lan",
]);

/**
 * Parse an IP-like string that might be decimal integer, hex, or octal.
 */
export function parseAmbiguousIp(hostname: string): string | null {
  const cleaned = hostname.replace(/^\[|\]$/g, "");

  // Already standard IPv4
  if (net.isIPv4(cleaned)) {
    return cleaned;
  }

  // Decimal integer IP (e.g. 2130706433 -> 127.0.0.1)
  if (/^\d+$/.test(cleaned)) {
    const num = Number(cleaned);
    if (!Number.isNaN(num) && num >= 0 && num <= 0xffffffff) {
      const p1 = (num >>> 24) & 255;
      const p2 = (num >>> 16) & 255;
      const p3 = (num >>> 8) & 255;
      const p4 = num & 255;
      return `${p1}.${p2}.${p3}.${p4}`;
    }
  }

  // Hexadecimal IP (e.g. 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/.test(cleaned)) {
    const num = Number.parseInt(cleaned, 16);
    if (!Number.isNaN(num) && num >= 0 && num <= 0xffffffff) {
      const p1 = (num >>> 24) & 255;
      const p2 = (num >>> 16) & 255;
      const p3 = (num >>> 8) & 255;
      const p4 = num & 255;
      return `${p1}.${p2}.${p3}.${p4}`;
    }
  }

  // Octal/dotted mixed (e.g. 0177.0.0.1)
  if (/^(\d+|0x[0-9a-fA-F]+)\.(\d+|0x[0-9a-fA-F]+)\.(\d+|0x[0-9a-fA-F]+)\.(\d+|0x[0-9a-fA-F]+)$/.test(cleaned)) {
    const parts = cleaned.split(".").map(part => {
      if (part.startsWith("0x") || part.startsWith("0X")) {
        return Number.parseInt(part, 16);
      }
      if (part.startsWith("0") && part.length > 1) {
        return Number.parseInt(part, 8);
      }
      return Number.parseInt(part, 10);
    });

    if (parts.every(p => !Number.isNaN(p) && p >= 0 && p <= 255)) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
    }
  }

  return null;
}

/**
 * Validates a target URL against SSRF rules, resolves DNS, and returns validation status.
 */
export async function validateUrlForSSRF(rawUrl: string): Promise<SSRFValidationResult> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { allowed: false, reason: "Invalid URL input" };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return { allowed: false, reason: "Empty URL provided" };
  }

  if (trimmed.length > 2048) {
    return { allowed: false, reason: "URL exceeds maximum allowed length of 2048 characters" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { allowed: false, reason: "Malformed URL format" };
  }

  // Protocol check: Only http: and https: are allowed
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { allowed: false, reason: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!hostname) {
    return { allowed: false, reason: "URL is missing a valid hostname" };
  }

  // Check blocked hostnames
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { allowed: false, reason: `Access to internal host "${hostname}" is blocked` };
  }

  // Check if hostname is an encoded/ambiguous IP
  const parsedIp = parseAmbiguousIp(hostname);
  if (parsedIp) {
    if (isPrivateOrReservedIPv4(parsedIp)) {
      return { allowed: false, reason: `Access to private/reserved IP "${parsedIp}" is blocked` };
    }
  }

  // Check direct IPv6
  const cleanIPv6 = hostname.replace(/^\[|\]$/g, "");
  if (net.isIPv6(cleanIPv6)) {
    if (isPrivateOrReservedIPv6(cleanIPv6)) {
      return { allowed: false, reason: `Access to private/reserved IPv6 "${cleanIPv6}" is blocked` };
    }
    return {
      allowed: true,
      normalizedUrl: parsed.href,
      resolvedIps: [cleanIPv6],
    };
  }

  // If direct IPv4
  if (net.isIPv4(hostname)) {
    if (isPrivateOrReservedIPv4(hostname)) {
      return { allowed: false, reason: `Access to private/reserved IP "${hostname}" is blocked` };
    }
    return {
      allowed: true,
      normalizedUrl: parsed.href,
      resolvedIps: [hostname],
    };
  }

  // DNS resolution check
  try {
    const lookups = await dns.lookup(hostname, { all: true });
    if (!lookups || lookups.length === 0) {
      return { allowed: false, reason: `DNS resolution failed for hostname "${hostname}"` };
    }

    const resolvedIps: string[] = [];
    for (const record of lookups) {
      resolvedIps.push(record.address);

      if (record.family === 4) {
        if (isPrivateOrReservedIPv4(record.address)) {
          return {
            allowed: false,
            reason: `Hostname "${hostname}" resolves to private/reserved IP "${record.address}"`,
          };
        }
      } else if (record.family === 6) {
        if (isPrivateOrReservedIPv6(record.address)) {
          return {
            allowed: false,
            reason: `Hostname "${hostname}" resolves to private/reserved IPv6 "${record.address}"`,
          };
        }
      }
    }

    return {
      allowed: true,
      normalizedUrl: parsed.href,
      resolvedIps,
    };
  } catch (err: any) {
    return {
      allowed: false,
      reason: `DNS lookup failed: ${err?.message || "Unknown error"}`,
    };
  }
}