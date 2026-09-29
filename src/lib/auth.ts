import "server-only";
import { redirect } from "next/navigation";
import { DEMO_TRAINEE_ID, getTrainee } from "./data";
import { authEnabled } from "./supabase/config";
import { createClient, db, dbEnabled } from "./supabase/server";

export type Role = "trainee" | "trainer" | "employer" | "admin";
export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  role: Role | "demo";
  /** Passport number for trainees; null for staff. */
  traineeId: string | null;
};

const DEMO_USER: AppUser = {
  id: "demo",
  name: getTrainee(DEMO_TRAINEE_ID)!.name,
  email: null,
  role: "demo",
  traineeId: DEMO_TRAINEE_ID,
};

/**
 * The signed-in user. Roles come from the profiles table (written only by the
 * server), never from user-editable metadata. Without Supabase configured the
 * app runs in demo mode, where one visitor can act as every role.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!authEnabled) return DEMO_USER;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  if (!dbEnabled) return { id: claims.sub, name: String(claims.email ?? "User"), email: (claims.email as string) ?? null, role: "trainee", traineeId: DEMO_TRAINEE_ID };
  const { data: profile } = await db().from("profiles").select("role, full_name, trainee_id").eq("user_id", claims.sub).maybeSingle();
  return {
    id: claims.sub,
    name: profile?.full_name ?? String(claims.email ?? "User"),
    email: (claims.email as string) ?? null,
    role: (profile?.role as Role) ?? "trainee",
    traineeId: profile?.trainee_id ?? null,
  };
}

export const isStaff = (u: AppUser) => u.role === "demo" || u.role === "trainer" || u.role === "employer" || u.role === "admin";
export const can = {
  runSessions: (u: AppUser) => u.role === "demo" || u.role === "trainer" || u.role === "admin",
  hire: (u: AppUser) => u.role === "demo" || u.role === "employer" || u.role === "admin",
  viewInsights: (u: AppUser) => u.role === "demo" || u.role === "trainer" || u.role === "admin",
  learn: (u: AppUser) => u.traineeId !== null,
};

/** For pages: signed-in user or a redirect to the sign-in page. */
export async function requireUser(next = "/app"): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For pages restricted to some roles: others are sent to their own home. */
export async function requireRole(check: (u: AppUser) => boolean, next: string): Promise<AppUser> {
  const user = await requireUser(next);
  if (!check(user)) redirect(homeFor(user));
  return user;
}

export function homeFor(u: AppUser) {
  if (u.role === "trainer") return "/app/attendance";
  if (u.role === "employer") return "/app/employer";
  if (u.role === "admin") return "/app/insights";
  return "/app";
}
