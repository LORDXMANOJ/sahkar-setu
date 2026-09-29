import type { Metadata } from "next";
import { AlertTriangle, CircleCheck, Eye } from "lucide-react";
import { RankedBars, TrendChart } from "@/components/app/charts";
import { PageHeader } from "@/components/app/ui";
import { PageTransition } from "@/components/page-transition";
import { monthlyTrained, stateOutreach, trainees } from "@/lib/data";
import { dropoutRisk } from "@/lib/insights";
import { IntegrityBadge } from "@/components/app/exam";
import { getTrainee } from "@/lib/data";
import { integritySummary } from "@/lib/store";

export const metadata: Metadata = { title: "Insights" };

const nf = new Intl.NumberFormat("en-IN");

export default function InsightsPage() {
  const exams = integritySummary();
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
    { label: "Trained, April to September", value: nf.format(trained) },
    { label: "Certified", value: `${Math.round((certified / trained) * 100)}%` },
    { label: "Placed in work", value: `${Math.round((placed / outreach) * 100)}%` },
    { label: "Trainees needing a call this week", value: String(atRisk) },
  ];

  return (
    <PageTransition>
      <PageHeader title="Programme insights" body="For NCCT, institute heads and the Ministry. Built from the same records trainees, institutes and employers create every day, so no one fills in a separate report." />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface p-5">
            <dt className="text-sm text-ink-soft">{t.label}</dt>
            <dd className="num display mt-2 text-[2rem] leading-none">{t.value}</dd>
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
        <h2 id="risk" className="font-semibold">Who might drop out</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Flagged from attendance, quiz trend and days since last activity. Each flag says why, so a trainer knows what to ask about.
        </p>

        <div className="-mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong text-ink-faint">
                <th scope="col" className="py-2.5 pr-4 font-medium">Trainee</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Status</th>
                <th scope="col" className="py-2.5 font-medium">Why</th>
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
                  <tr key={t.id} className="border-b border-line align-top">
                    <td className="py-3.5 pr-4">
                      <span className="block font-semibold">{t.name}</span>
                      <span className="text-ink-faint">{t.society}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${status.cls}`}>
                        <status.Icon className="size-3.5" aria-hidden="true" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-ink-soft">{r.factors.join(". ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="exam-activity" className="panel mt-6 p-6">
        <h2 id="exam-activity" className="font-semibold">Exam activity</h2>
        <p className="mt-1 text-sm text-ink-soft">
          From monitored exams: how often each trainee left the exam screen, for how long, and whether they pasted text. It shows what happened, not why.
        </p>
        {exams.length === 0 ? (
          <p className="mt-5 text-sm text-ink-faint">No monitored exams yet. Trainees take them from Learn, then Final assessment.</p>
        ) : (
          <div className="-mx-6 mt-5 overflow-x-auto px-6">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-faint">
                  <th scope="col" className="py-2.5 pr-4 font-medium">Trainee</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Left the exam</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Time away</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Pasted</th>
                  <th scope="col" className="py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.examId + e.traineeId} className="border-b border-line">
                    <td className="py-3 pr-4 font-medium">
                      {getTrainee(e.traineeId)?.name ?? e.traineeId}
                      {!e.submitted && <span className="ml-2 text-xs font-normal text-ink-faint">in progress</span>}
                    </td>
                    <td className="num py-3 pr-4">{e.left === 1 ? "once" : `${e.left} times`}</td>
                    <td className="num py-3 pr-4">{Math.round(e.awayMs / 1000)}s</td>
                    <td className="num py-3 pr-4">{e.pastes}</td>
                    <td className="py-3"><IntegrityBadge left={e.left} pastes={e.pastes} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageTransition>
  );
}
