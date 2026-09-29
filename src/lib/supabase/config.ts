// Supabase is optional: without these variables the app runs in demo mode with
// in-memory data and no sign-in, which is how it works on a laptop with no setup.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
