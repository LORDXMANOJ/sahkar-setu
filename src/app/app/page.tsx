import Link from "next/link";
import { BedDouble, Clock, MapPin, QrCode } from "lucide-react";
import { LearnProgress } from "@/components/app/learn-progress";
import { Pill, SectionTitle } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { Stamp } from "@/components/stamp";
import {
  certificatesFor,
  DEMO_TRAINEE_ID,
  getInstitute,
  getProgramme,
  getTrainee,
  jobs,
  lessons,
} from "@/lib/data";
import { matchJob } from "@/lib/insights";
import { getDictionary } from "@/lib/i18n/server";

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Day 3 of the current residential programme.
const today = [
  { time: "09:30", what: "Calibrating the milk analyser", where: "Dairy lab 2", now: false },
  { time: "11:15", what: "Adulteration strip tests, hands-on", where: "Dairy lab 2", now: true },
  { time: "14:00", what: "Bulk milk cooler upkeep", where: "Chilling centre visit", now: false },
  { time: "16:30", what: "Quiz: cold chain", where: "In the app", now: false },
];

export default async function TraineeHome() {
  const { t } = await getDictionary();
  const trainee = getTrainee(DEMO_TRAINEE_ID)!;
  const certs = certificatesFor(trainee.id);
  const current = getProgramme("milk-quality")!;
  const institute = getInstitute(current.instituteId)!;
  const top = jobs
    .map((job) => ({ job, m: matchJob(trainee, job) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3);

  return (
    <PageTransition>
      <div className="mt-2 mb-8">
        <p className="text-ink-soft">{t.app.greeting},</p>
        <h1 className="display text-2xl sm:text-3xl">{trainee.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Today */}
          <section aria-labelledby="today" className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Pill tone="accent">Day 3 of {current.days}</Pill>
                <h2 id="today" className="mt-3 text-xl font-semibold">{current.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="size-4" aria-hidden="true" />
                  {institute.short}, {institute.city}
                </p>
              </div>
              <Link href="/app/attendance" className="btn btn-primary" transitionTypes={["nav-forward"]}>
                <QrCode className="size-[1.125rem]" aria-hidden="true" />
                Mark attendance
              </Link>
            </div>

            <ol className="mt-6 space-y-1" aria-label="Today's timetable">
              {today.map((s) => (
                <li
                  key={s.time}
                  className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-xl px-3 py-2.5 ${s.now ? "bg-warn-wash" : ""}`}
                  aria-current={s.now ? "time" : undefined}
                >
                  <span className="num pt-px text-sm font-semibold">{s.time}</span>
                  <span>
                    <span className="block font-medium">{s.what}</span>
                    <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                      {s.now && <Clock className="size-3.5 text-warn-deep" aria-hidden="true" />}
                      {s.now ? "Now, " : ""}
                      {s.where}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-soft">
              <BedDouble className="size-4" aria-hidden="true" />
              Hostel: Block B, room 14. Breakfast 8:00, dinner 20:00.
            </p>
          </section>

          {/* Learning */}
          <section aria-labelledby="learning" className="panel p-5 sm:p-6">
            <SectionTitle>
              <span id="learning">{t.app.learn}</span>
            </SectionTitle>
            <p className="-mt-2 mb-5 text-sm text-ink-soft">Saved on this phone. Works without internet.</p>
            <LearnProgress lessonIds={lessons["milk-quality"].map((l) => l.id)} firstHref="/app/learn" />
          </section>
        </div>

        <div className="space-y-6">
          {/* Passport */}
          <section aria-labelledby="passport" className="panel overflow-hidden">
            <div className="paper p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="passport" className="display text-lg">{t.passport.title}</h2>
                  <p className="num mt-0.5 text-sm text-[#4a5275]">{trainee.id}</p>
                </div>
                <div className="w-20 -rotate-6" aria-hidden="true">
                  <Stamp label="Certified" place="NCCT" date="2026" tone="ok" className="h-auto w-full" />
                </div>
              </div>
              <ul className="mt-4 divide-y divide-[#16204a]/10">
                {certs.map((c) => {
                  const p = getProgramme(c.programmeSlug)!;
                  return (
                    <li key={c.id} className="py-3">
                      <Link href={`/verify/${c.id}`} className="group block">
                        <span className="block font-semibold group-hover:underline">{p.title}</span>
                        <span className="text-sm text-[#4a5275]">
                          {c.grade}, {shortDate.format(new Date(c.issuedOn))}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Jobs */}
          <section aria-labelledby="matches" className="panel p-5 sm:p-6">
            <SectionTitle
              action={
                <Link href="/app/jobs" className="text-sm font-semibold text-accent hover:underline">
                  All jobs
                </Link>
              }
            >
              <span id="matches">Best matches for you</span>
            </SectionTitle>
            <ul className="space-y-4">
              {top.map(({ job, m }) => (
                <li key={job.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{job.title}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {job.employer}, {job.district}
                    </p>
                  </div>
                  <span className="num self-start rounded-full bg-ok-wash px-2.5 py-1 text-sm font-bold text-ok">
                    {m.score}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
