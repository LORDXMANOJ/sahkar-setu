"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { applyToJob } from "@/app/app/jobs/actions";

export function ApplyButton({ jobId, applied }: { jobId: string; applied: boolean }) {
  const [done, setDone] = useState(applied);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="rise inline-flex items-center gap-2 text-sm font-semibold text-ok" role="status">
        <Check className="size-4" aria-hidden="true" />
        Applied. The employer can now see your passport.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await applyToJob(jobId);
            if (r.ok) setDone(true);
            else setError(r.message);
          })
        }
        className="btn btn-primary"
      >
        {pending ? "Applying…" : "Apply with my passport"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
