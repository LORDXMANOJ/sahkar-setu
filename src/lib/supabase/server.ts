import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/** Per-request client that acts as the signed-in user (reads and refreshes auth cookies). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes them.
        }
      },
    },
  });
}

// The secret key bypasses row-level security, so it is only ever used in server
// code, after the app has checked who the user is and what they may do.
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
export const dbEnabled = Boolean(SUPABASE_URL && SECRET);

let admin: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!dbEnabled) throw new Error("Database is not configured.");
  admin ??= createAdminClient(SUPABASE_URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
