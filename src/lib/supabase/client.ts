import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Cliente único no browser. A sessão fica no localStorage; a proteção dos dados é a RLS do Supabase. */
export const supabaseBrowser = (): SupabaseClient => {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true } },
  );
  return client;
};
