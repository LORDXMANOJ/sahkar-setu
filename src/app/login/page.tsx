import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { authEnabled } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!authEnabled) redirect("/app");
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : homeFor(user));

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-10">
      <Logo />
      <div className="mt-10">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-ink-soft">Trainee accounts are created by your institute when you are nominated for a programme.</p>
      </div>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
