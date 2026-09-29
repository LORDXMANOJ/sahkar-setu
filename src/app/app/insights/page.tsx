import type { Metadata } from "next";
import {
  AlertTriangle,
  Award,
  Briefcase,
  CircleCheck,
  Eye,
  GraduationCap,
  PhoneCall,
} from "lucide-react";
import { RankedBars, TrendChart } from "@/components/app/charts";
import { PageTransition } from "@/components/page-transition";
import { monthlyTrained, stateOutreach, trainees } from "@/lib/data";
import { dropoutRisk } from "@/lib/insights";
import { IntegrityBadge } from "@/components/app/exam";
import { getTrainee } from "@/lib/data";
import { integritySummary } from "@/lib/store";
import { can, requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Insights" };

const nf = new Intl.NumberFormat("en-IN");

export default async function InsightsPage() {
  await requireRole(can.viewInsights, "/app/insights");
  const exams = await integritySummary();
  const trained = monthlyTrained.reduce((s, m) => s + m.trained, 0);
  const certified = monthlyTrained.reduce((s, m) => s + m.certified, 0);
  const outreach = stateOutreach.reduce((s, r) => s + r.trainees, 0);
  const placed = stateOutreach.reduce((s, r) => s + r.placed, 0);

  const risks = trainees
    .map((t) => ({ t, r: dropoutRisk(t) }))
    .sort((a, b) => b.r.score - a.r.score);
  const atRisk = risks.filter((x) => x.r.level !== "low").length;

  const placement = stateOutreach
    .map((s) => ({
      label: s.state,
      value: Math.round((s.placed / s.trainees) * 100),
      detail: `${nf.format(s.placed)} placed of ${nf.format(s.trainees)} trained`,
    }))
    .sort((a, b) => b.value - a.value);

  const tiles = [
    { label: "Trained, April–September", value: nf.format(trained), Icon: GraduationCap },
    { label: "Certified", value: `${Math.round((certified / trained) * 100)}%`, Icon: Award },
    { label: "Placed in work", value: `${Math.round((placed / outreach) * 100)}%`, Icon: Briefcase },
    { label: "Need a call this week", value: String(atRisk), Icon: PhoneCall, urgent: atRisk > 0 },
  ];

  return (
    <PageTransition>
      <div className="insights-theme -mx-4 -mt-6 rounded-b-2xl bg-canvas px-4 pt-6 pb-10 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mt-10 lg:px-10 lg:pt-10">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-3xl">Programme insights</h1>
          <p className="mt-2.5 text-ink-soft">
            For NCCT, institute heads and the Ministry. Built from the same records trainees, institutes and employers
            create every day, so no one fills in a separate report.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="panel flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <dt className="text-[0.8125rem] leading-tight text-ink-soft">{t.label}</dt>
                <dd className="num mt-2 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-[2rem]">
                  {t.value}
                </dd>
              </div>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                  t.urgent ? "bg-danger-wash text-danger" : "bg-accent-wash text-accent"
                }`}
                aria-hidden="true"
              >
                <t.Icon className="size-[1.125rem]" strokeWidth={2} />
              </span>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="panel min-w-0 p-5 sm:p-6">
            <TrendChart
              title="Trainees per month"
              data={monthlyTrained}
              x="month"
              series={[
                { key: "trained", label: "Trained", color: "var(--series-1)" },
                { key: "certified", label: "Certified", color: "var(--series-2)" },
              ]}
            />
          </section>
          <section className="panel p-5 sm:p-6">
            <RankedBars title="Placement rate by state" rows={placement} />
          </section>
        </div>

        <section aria-labelledby="risk" className="panel mt-6 p-5 sm:p-6">
          <h2 id="risk" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
            Who might drop out
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Flagged from attendance, quiz trend and days since last activity. Each flag says why, so a trainer knows
            what to ask about.
          </p>

          <div className="-mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" className="rounded-l-lg bg-canvas py-2.5 pr-4 pl-3 text-xs font-medium text-ink-faint">
                    Trainee
                  </th>
                  <th scope="col" className="bg-canvas py-2.5 pr-4 text-xs font-medium text-ink-faint">
                    Status
                  </th>
                  <th scope="col" className="rounded-r-lg bg-canvas py-2.5 pr-3 text-xs font-medium text-ink-faint">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {risks.map(({ t, r }) => {
                  const status =
                    r.level === "high"
                      ? { Icon: AlertTriangle, label: "Call today", cls: "bg-danger-wash text-danger" }
                      : r.level === "watch"
                        ? { Icon: Eye, label: "Keep an eye on", cls: "bg-warn-wash text-warn-deep" }
                        : { Icon: CircleCheck, label: "On track", cls: "bg-ok-wash text-ok" };
                  return (
                    <tr key={t.id} className="border-b border-line align-top last:border-0">
                      <td className="py-3.5 pr-4 pl-3">
                        <span className="block font-medium">{t.name}</span>
                        <span className="text-ink-faint">{t.society}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${status.cls}`}
                        >
                          <status.Icon className="size-3.5" aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-ink-soft">{r.factors.join(". ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="exam-activity" className="panel mt-6 p-5 sm:p-6">
          <h2 id="exam-activity" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
            Exam activity
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            From monitored exams: how often each trainee left the exam screen, for how long, and whether they pasted
            text. It shows what happened, not why.
          </p>
          {exams.length === 0 ? (
            <p className="mt-5 text-sm text-ink-faint">No monitored exams yet. Trainees take them from Learn, then Final assessment.</p>
          ) : (
            <div className="-mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="rounded-l-lg bg-canvas py-2.5 pr-4 pl-3 text-xs font-medium text-ink-faint">
                      Trainee
                    </th>
                    <th scope="col" className="bg-canvas py-2.5 pr-4 text-xs font-medium text-ink-faint">
                      Left the exam
                    </th>
                    <th scope="col" className="bg-canvas py-2.5 pr-4 text-xs font-medium text-ink-faint">
                      Time away
                    </th>
                    <th scope="col" className="bg-canvas py-2.5 pr-4 text-xs font-medium text-ink-faint">
                      Pasted
                    </th>
                    <th scope="col" className="rounded-r-lg bg-canvas py-2.5 pr-3 text-xs font-medium text-ink-faint">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e) => (
                    <tr key={e.examId + e.traineeId} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 pl-3 font-medium">
                        {getTrainee(e.traineeId)?.name ?? e.traineeId}
                        {!e.submitted && <span className="ml-2 text-xs font-normal text-ink-faint">in progress</span>}
                      </td>
                      <td className="num py-3 pr-4">{e.left === 1 ? "once" : `${e.left} times`}</td>
                      <td className="num py-3 pr-4">{Math.round(e.awayMs / 1000)}s</td>
                      <td className="num py-3 pr-4">{e.pastes}</td>
                      <td className="py-3 pr-3">
                        <IntegrityBadge left={e.left} pastes={e.pastes} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
