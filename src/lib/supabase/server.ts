// typescript
// src/lib/supabase/server.ts
// Use the official supabase-js client directly on the server to avoid version/API
// mismatches with the auth-helpers package. This client is suitable for server
// usage where you don't need cookie/session helpers.
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Server-side client: don't persist sessions or try to detect sessions in URL
  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
