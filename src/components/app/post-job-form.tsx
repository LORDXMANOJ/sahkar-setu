"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { postJobAction, type PostJobState } from "@/app/app/jobs/actions";

function Field({ label, name, error, ...rest }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`pj-${name}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input id={`pj-${name}`} name={name} className="field" aria-invalid={Boolean(error)} aria-describedby={error ? `pj-${name}-err` : undefined} {...rest} />
      {error && (
        <p id={`pj-${name}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PostJobForm({ skills }: { skills: string[] }) {
  const [state, action, pending] = useActionState<PostJobState, FormData>(postJobAction, {});
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.ok && state.jobId) {
      form.current?.reset();
      router.push(`/app/employer?job=${state.jobId}`);
    }
  }, [state, router]);

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Field label="Job title" name="title" error={e.title} placeholder="Milk collection centre in-charge" maxLength={80} required />
      </div>
      <Field label="Employer" name="employer" error={e.employer} placeholder="Your society or union" maxLength={80} required />
      <Field label="Pay" name="pay" error={e.pay} placeholder="₹16,000 / month" maxLength={40} required />
      <Field label="District" name="district" error={e.district} maxLength={40} required />
      <Field label="State" name="state" error={e.state} maxLength={40} required />
      <div>
        <label htmlFor="pj-kind" className="mb-1.5 block text-sm font-medium">
          Type
        </label>
        <select id="pj-kind" name="kind" className="field" defaultValue="Full time">
          <option>Full time</option>
          <option>Seasonal</option>
          <option>Apprenticeship</option>
          <option>Enterprise support</option>
        </select>
      </div>
      <Field label="Openings" name="openings" error={e.openings} type="number" inputMode="numeric" min={1} max={500} defaultValue={1} />

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium">Skills needed</legend>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <label key={s} className="cursor-pointer">
              <input type="checkbox" name="skills" value={s} className="peer sr-only" />
              <span className="inline-block rounded-full px-3 py-1.5 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line-strong)] transition-colors select-none peer-checked:bg-ink peer-checked:text-canvas peer-checked:shadow-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                {s}
              </span>
            </label>
          ))}
        </div>
        {e.skills && <p className="mt-2 text-sm text-danger">{e.skills}</p>}
      </fieldset>

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Posting…" : "Post job and see candidates"}
        </button>
      </div>
    </form>
  );
}
