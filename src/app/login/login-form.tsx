"use client";

import { useActionState, useState, useTransition } from "react";
import { Briefcase, GraduationCap, Presentation } from "lucide-react";
import { demoSignIn, signIn, type SignInState } from "./actions";

const demos = [
  { role: "trainee", label: "Trainee", who: "Lakshmi Devi, dairy cooperative", Icon: GraduationCap },
  { role: "trainer", label: "Trainer", who: "Runs classes and attendance", Icon: Presentation },
  { role: "employer", label: "Employer", who: "Posts jobs, reviews candidates", Icon: Briefcase },
] as const;

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoPending, startDemo] = useTransition();
  const [which, setWhich] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="demo-title" className="panel p-5">
        <h2 id="demo-title" className="font-semibold">Try a demo account</h2>
        <p className="mt-1 text-sm text-ink-soft">One tap, no password. Sample data only.</p>
        <div className="mt-4 grid gap-2">
          {demos.map(({ role, label, who, Icon }) => (
            <button
              key={role}
              type="button"
              disabled={demoPending}
              onClick={() => {
                setWhich(role);
                setDemoError(null);
                startDemo(async () => {
                  const r = await demoSignIn(role, next);
                  if (r?.error) setDemoError(r.error);
                });
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left ring-1 ring-line transition-colors hover:bg-canvas disabled:opacity-60"
            >
              <Icon className="size-5 text-accent" aria-hidden="true" />
              <span className="flex-1">
                <span className="block font-medium">{demoPending && which === role ? "Signing in…" : label}</span>
                <span className="block text-sm text-ink-faint">{who}</span>
              </span>
            </button>
          ))}
        </div>
        {demoError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {demoError}
          </p>
        )}
      </section>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} className="field" />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
