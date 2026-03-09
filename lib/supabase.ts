import { createClient, SupabaseClient } from "@supabase/supabase-js";
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      [
        "Supabase credentials missing.",
        "Add these to your .env.local file:",
        "  SUPABASE_URL=https://your-project.supabase.co",
        "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
      ].join("\n")
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

// Named export for convenience — same as before
export const supabase = {
  from: (table: string) => getSupabase().from(table),
  storage: { from: (bucket: string) => getSupabase().storage.from(bucket) },
  table: (table: string) => getSupabase().from(table),
};