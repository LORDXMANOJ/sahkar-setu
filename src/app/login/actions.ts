"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { overLimit } from "@/lib/rate-limit";
import { authEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type SignInState = { error?: string };

// Demo accounts for judges and reviewers. Their password is a server-side
// secret; the buttons never expose it to the browser.
const DEMO_ACCOUNTS = {
  trainee: "trainee@demo.sahkarsetu.in",
  trainer: "trainer@demo.sahkarsetu.in",
  employer: "employer@demo.sahkarsetu.in",
} as const;

function safeNext(next: unknown) {
  const n = typeof next === "string" ? next : "";
  // Only same-site paths: blocks open redirects like //evil.com or https://evil.com.
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/app";
}

async function limited() {
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  return overLimit(`signin:${ip}`, 10, 5 * 60_000);
}

const Creds = z.object({ email: z.email().max(200), password: z.string().min(6).max(200) });

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  if (!authEnabled) redirect("/app");
  if (await limited()) return { error: "Too many sign-in attempts. Wait five minutes and try again." };
  const parsed = Creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown email and wrong password, so accounts can't be discovered.
  if (error) return { error: "That email and password don't match an account." };
  redirect(safeNext(form.get("next")));
}

export async function demoSignIn(role: keyof typeof DEMO_ACCOUNTS, next?: string): Promise<SignInState> {
  if (!authEnabled) redirect("/app");
  const email = DEMO_ACCOUNTS[role];
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "Demo accounts aren't set up on this server." };
  if (await limited()) return { error: "Too many sign-in attempts. Wait five minutes and try again." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Demo accounts aren't set up yet. Run the seed script (see README)." };
  const home = role === "trainer" ? "/app/attendance" : role === "employer" ? "/app/employer" : "/app";
  redirect(next && safeNext(next) !== "/app" ? safeNext(next) : home);
}

export async function signOut() {
  if (authEnabled) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
