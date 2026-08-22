-- Supabase PostgreSQL Migration for Uptime Checker

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Monitors Table
CREATE TABLE IF NOT EXISTS public.monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 5 CHECK (interval_minutes IN (5, 10, 15, 30, 60)),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Checks Table
CREATE TABLE IF NOT EXISTS public.checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID REFERENCES public.monitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('UP', 'DOWN', 'TIMEOUT', 'ERROR')),
  http_status INTEGER,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  final_url TEXT NOT NULL,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DOWN', 'DEGRADED')),
  cause TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_monitors_enabled ON public.monitors(enabled);
CREATE INDEX IF NOT EXISTS idx_checks_monitor_id_checked_at ON public.checks(monitor_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_url_checked_at ON public.checks(url, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id_open ON public.incidents(monitor_id) WHERE resolved_at IS NULL;

-- Row Level Security (RLS)
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Allow public read access to monitors, checks, and incidents
CREATE POLICY "Allow public read access to monitors" ON public.monitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert to monitors" ON public.monitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to monitors" ON public.monitors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to monitors" ON public.monitors FOR DELETE USING (true);

CREATE POLICY "Allow public read access to checks" ON public.checks FOR SELECT USING (true);
CREATE POLICY "Allow public insert to checks" ON public.checks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public insert to incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to incidents" ON public.incidents FOR UPDATE USING (true);