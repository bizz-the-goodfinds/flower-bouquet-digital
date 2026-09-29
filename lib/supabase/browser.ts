"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

let client: Promise<SupabaseClient> | null = null;

/**
 * The browser Supabase client, loaded on first use: the SDK is a large chunk and pages only need it
 * for realtime and sign-in, so it stays out of the initial bundle.
 */
export function supabaseBrowser() {
  client ??= import("@supabase/ssr").then(({ createBrowserClient }) =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!),
  );
  return client;
}
