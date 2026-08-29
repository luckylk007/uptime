export type UptimeStatus = "UP" | "DOWN" | "TIMEOUT" | "ERROR";

export interface RegionLatency {
  cityName: string;
  country: string;
  flag: string;
  status: UptimeStatus;
  statusText: string;
  resolveTimeSec: number;
  connectTimeSec: number;
  downloadTimeSec: number;
  totalTimeSec: number;
  totalSizeKb: number;
}

export interface CheckTimingBreakdown {
  dnsTimeMs: number;
  connectTimeMs: number;
  downloadTimeMs: number;
  totalTimeMs: number;
  totalSizeKb: number;
}

export interface CheckResult {
  url: string;
  status: UptimeStatus;
  httpStatus: number | null;
  responseTimeMs: number;
  finalUrl: string;
  checkedAt: string;
  error: string | null;
  timing?: CheckTimingBreakdown;
  regions?: RegionLatency[];
}

export interface CheckRequest {
  urls: string[];
}

export interface CheckResponse {
  results: CheckResult[];
  error?: string;
}

export interface Monitor {
  id: string;
  user_id?: string | null;
  url: string;
  interval_minutes: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_check?: CheckResult | null;
  uptime_percentage_24h?: number;
  avg_response_time_24h?: number;
}

export interface DbCheck {
  id?: string;
  monitor_id?: string | null;
  url: string;
  status: UptimeStatus;
  http_status: number | null;
  response_time_ms: number;
  final_url: string;
  error: string | null;
  checked_at: string;
}

export interface Incident {
  id: string;
  monitor_id: string;
  url: string;
  status: "DOWN" | "DEGRADED";
  cause: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
}