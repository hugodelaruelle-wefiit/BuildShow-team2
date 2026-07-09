import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser (Client Components).
 *
 * Uses only the public anon key — never the service-role key, which stays
 * server-side. Safe to call in any `"use client"` component.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
