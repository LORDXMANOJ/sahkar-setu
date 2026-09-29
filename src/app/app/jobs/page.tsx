import type { Metadata } from "next";
import { MapPin, Wallet } from "lucide-react";
import { ApplyButton } from "@/components/app/apply-button";
import { Meter, PageHeader, Pill } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { can, requireRole } from "@/lib/auth";
import { getTrainee } from "@/lib/data";
import { matchJob } from "@/lib/insights";
import { allJobs, appliedJobIds } from "@/lib/store";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const user = await requireRole(can.learn, "/app/jobs");
  const trainee = getTrainee(user.traineeId!)!;
  const applied = await appliedJobIds(trainee.id);
  const ranked = (await allJobs())
    .map((job) => ({ job, m: matchJob(trainee, job) }))
    .sort((a, b) => b.m.score - a.m.score);

  return (
    <PageTransition>
      <PageHeader
        title="Jobs that fit your passport"
        body="Ranked by the skills you're certified in, then by how close the work is to home. Each one shows why it matched and what you'd still need to learn."
      />

      <ul className="space-y-4">
        {ranked.map(({ job, m }) => (
          <li key={job.id} className="panel p-5 sm:p-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={job.kind === "Enterprise support" ? "warn" : "neutral"}>{job.kind}</Pill>
                  {job.openings > 1 && <Pill>{job.openings} openings</Pill>}
                </div>
                <h2 className="mt-3 text-lg font-semibold">{job.title}</h2>
                <p className="text-ink-soft">{job.employer}</p>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {job.district}, {job.state}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Wallet className="size-4" aria-hidden="true" />
                    {job.pay}
                  </span>
                </p>

                {m.reasons.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm">
                    {m.reasons.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                {m.missing.length > 0 && (
                  <p className="mt-2 text-sm text-ink-faint">To learn: {m.missing.join(", ")}</p>
                )}
                <div className="mt-5">
                  <ApplyButton jobId={job.id} applied={applied.has(job.id)} />
                </div>
              </div>

              <div className="md:border-l md:border-line md:pl-6">
                <p className="text-sm text-ink-soft">Match</p>
                <p className="num display text-3xl leading-none">{m.score}%</p>
                <div className="mt-3">
                  <Meter value={m.score} tone={m.score >= 70 ? "ok" : m.score >= 45 ? "warn" : "danger"} label={`Match for ${job.title}`} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </PageTransition>
  );
}
