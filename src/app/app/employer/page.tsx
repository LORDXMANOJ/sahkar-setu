import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { PostJobForm } from "@/components/app/post-job-form";
import { Meter, PageHeader, Pill } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { certificatesFor, getProgramme, programmes, trainees } from "@/lib/data";
import { matchJob } from "@/lib/insights";
import { allJobs, applicationsFor } from "@/lib/store";

export const metadata: Metadata = { title: "Employer" };

export default async function EmployerPage({ searchParams }: PageProps<"/app/employer">) {
  const { job: jobParam } = await searchParams;
  const list = allJobs();
  const job = list.find((j) => j.id === jobParam) ?? list[0];
  const applied = new Set(applicationsFor(job.id).map((a) => a.traineeId));

  const candidates = trainees
    .map((t) => ({ t, m: matchJob(t, job) }))
    .filter(({ m, t }) => m.score >= 25 || applied.has(t.id))
    .sort((a, b) => Number(applied.has(b.t.id)) - Number(applied.has(a.t.id)) || b.m.score - a.m.score);

  const skills = [...new Set(programmes.flatMap((p) => p.skills))].sort();

  return (
    <PageTransition>
      <PageHeader
        title="Candidates, ranked by certified skills"
        body="Every certificate here is signed by NCCT. Open one to check it yourself."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="Your jobs" className="panel h-fit p-2">
          <ul className="scroll-quiet flex gap-1 overflow-x-auto lg:block">
            {list.map((j) => {
              const active = j.id === job.id;
              return (
                <li key={j.id} className="w-60 shrink-0 lg:w-auto">
                  <Link
                    href={`/app/employer?job=${j.id}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2.5 transition-colors ${active ? "bg-ink text-canvas" : "hover:bg-line/50"}`}
                  >
                    <span className="block text-sm font-semibold">{j.title}</span>
                    <span className={`block truncate text-xs ${active ? "opacity-75" : "text-ink-faint"}`}>
                      {j.employer}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <section aria-labelledby="job-title" className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="job-title" className="text-xl font-semibold">{job.title}</h2>
                <p className="text-sm text-ink-soft">
                  {job.employer}, {job.district}. {job.pay}
                </p>
              </div>
              <Pill tone="accent">
                <span className="num">{candidates.length}</span> candidates
              </Pill>
            </div>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </p>

            <ul className="mt-6 divide-y divide-line">
              {candidates.map(({ t, m }) => {
                const certs = certificatesFor(t.id);
                return (
                  <li key={t.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{t.name}</p>
                        {applied.has(t.id) && <Pill tone="ok">Applied</Pill>}
                      </div>
                      <p className="text-sm text-ink-soft">
                        {t.role}, {t.society}, {t.district}
                      </p>
                      <p className="mt-2 text-sm">{m.reasons.join(". ") || "Some overlapping skills"}</p>
                      {m.missing.length > 0 && <p className="mt-1 text-sm text-ink-faint">Missing: {m.missing.join(", ")}</p>}
                      {certs.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {certs.map((c) => (
                            <li key={c.id}>
                              <Link
                                href={`/verify/${c.id}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-ok-wash px-3 py-1 text-xs font-semibold text-ok hover:underline"
                              >
                                <BadgeCheck className="size-3.5" aria-hidden="true" />
                                {getProgramme(c.programmeSlug)?.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="num display text-[1.75rem] leading-none">{m.score}%</p>
                      <div className="mt-2">
                        <Meter value={m.score} tone={m.score >= 70 ? "ok" : m.score >= 45 ? "warn" : "danger"} label={`${t.name} match`} />
                      </div>
                    </div>
                  </li>
                );
              })}
              {candidates.length === 0 && (
                <li className="py-6 text-ink-soft">No trainees match this job yet. Widen the skills, or check back after the next programme.</li>
              )}
            </ul>
          </section>

          <section aria-labelledby="post-title" className="panel p-5 sm:p-6">
            <h2 id="post-title" className="text-lg font-semibold">Post a job</h2>
            <p className="mt-1 mb-6 text-sm text-ink-soft">Candidates are ranked the moment you post.</p>
            <PostJobForm skills={skills} />
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
