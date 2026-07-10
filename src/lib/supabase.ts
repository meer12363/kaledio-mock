import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient | null = null;

/** Browser singleton — session persisted in localStorage by supabase-js. */
export function supabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

/**
 * Server-side client scoped to one request. Carries the caller's access token
 * so Postgres row-level security applies to every query.
 */
export function supabaseForToken(token?: string | null): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export const SUPABASE_URL = url;
