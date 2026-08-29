import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseUrl = rawUrl.trim().replace(/^['"]|['"]$/g, "");
const supabaseAnonKey = rawAnonKey.trim().replace(/^['"]|['"]$/g, "");
const supabaseServiceKey = rawServiceKey.trim().replace(/^['"]|['"]$/g, "");

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseAnonKey || supabaseServiceKey)
);

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      return null;
    }
  }
  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  if (!supabaseAdminClient) {
    try {
      supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
    } catch {
      return null;
    }
  }
  return supabaseAdminClient;
}