// Supabase is optional: without these variables the app runs in demo mode with
// in-memory data and no sign-in, which is how it works on a laptop with no setup.
// Tolerate a URL pasted with a path such as /rest/v1/: the clients need only the origin.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^(https:\/\/[^/]+).*$/, "$1");
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
