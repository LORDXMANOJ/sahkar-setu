"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Download,
  Eye,
  GraduationCap,
  Lightbulb,
  Phone,
  PhoneCall,
} from "lucide-react";
import { RankedBars, TrendChart } from "./charts";
import { IntegrityBadge } from "./exam";

export type MonthRow = { month: string; trained: number; certified: number };
export type StateRow = { state: string; trainees: number; placed: number };
export type RiskRow = {
  id: string;
  name: string;
  society: string;
  district: string;
  state: string;
  phone: string;
  level: "high" | "watch" | "low";
  score: number;
  factors: string[];
  daysInactive: number;
};
export type ExamRow = { key: string; name: string; left: number; awaySec: number; pastes: number; submitted: boolean };

const nf = new Intl.NumberFormat("en-IN");
const LOW_PLACEMENT = 25;
const YEAR = 2026;

const levelMeta = {
  high: { label: "Call today", Icon: AlertTriangle, cls: "bg-danger-wash text-danger" },
  watch: { label: "Watch", Icon: Eye, cls: "bg-warn-wash text-warn-deep" },
  low: { label: "On track", Icon: CircleCheck, cls: "bg-ok-wash text-ok" },
} as const;

type Tab = "all" | "high" | "watch" | "low";
type SortKey = "risk" | "name" | "active";

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Spreadsheet apps execute cells starting with = + - @; prefix them so an exported name can't run as a formula. */
function csvCell(v: string | number) {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function Delta({ value, unit, label }: { value: number; unit: "%" | "pts"; label: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const text = unit === "%" ? `${Math.abs(value).toFixed(1)}%` : `${Math.abs(value).toFixed(1)} pts`;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ink-faint">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${up ? "bg-ok-wash text-ok" : "bg-danger-wash text-danger"}`}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="sr-only">{up ? "Up" : "Down"} </span>
        {text}
      </span>
      {label}
    </p>
  );
}

export function InsightsDashboard({
  months,
  states,
  risks,
  exams,
}: {
  months: MonthRow[];
  states: StateRow[];
  risks: RiskRow[];
  exams: ExamRow[];
}) {
  const [period, setPeriod] = useState<3 | 6>(6);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "risk", dir: -1 });
  const [showLow, setShowLow] = useState(false);

  const shown = months.slice(-period);
  const last3 = months.slice(-3);
  const prev3 = months.slice(-6, -3);
  const sum = (rows: MonthRow[], k: "trained" | "certified") => rows.reduce((s, r) => s + r[k], 0);
  const rangeLabel = `${shown[0].month}–${shown[shown.length - 1].month} ${YEAR}`;
  const compareLabel = `${last3[0].month}–${last3[2].month} vs ${prev3[0].month}–${prev3[2].month}`;

  const trained = sum(shown, "trained");
  const certRate = (sum(shown, "certified") / trained) * 100;
  const trainedDelta = ((sum(last3, "trained") - sum(prev3, "trained")) / sum(prev3, "trained")) * 100;
  const certDelta = (sum(last3, "certified") / sum(last3, "trained") - sum(prev3, "certified") / sum(prev3, "trained")) * 100;

  const statesInScope = stateFilter === "all" ? states : states.filter((s) => s.state === stateFilter);
  const placedRate =
    (statesInScope.reduce((s, r) => s + r.placed, 0) / Math.max(1, statesInScope.reduce((s, r) => s + r.trainees, 0))) * 100;

  const placement = useMemo(
    () =>
      states
        .map((s) => ({
          label: s.state,
          value: Math.round((s.placed / s.trainees) * 100),
          detail: `${nf.format(s.placed)} placed of ${nf.format(s.trainees)} trained`,
        }))
        .sort((a, b) => b.value - a.value),
    [states],
  );
  const lowStates = placement.filter((p) => p.value < LOW_PLACEMENT).map((p) => p.label);

  const scopedRisks = stateFilter === "all" ? risks : risks.filter((r) => r.state === stateFilter);
  const counts = {
    all: scopedRisks.length,
    high: scopedRisks.filter((r) => r.level === "high").length,
    watch: scopedRisks.filter((r) => r.level === "watch").length,
    low: scopedRisks.filter((r) => r.level === "low").length,
  };

  const rows = useMemo(() => {
    const list = tab === "all" ? scopedRisks : scopedRisks.filter((r) => r.level === tab);
    const cmp = {
      risk: (a: RiskRow, b: RiskRow) => a.score - b.score,
      name: (a: RiskRow, b: RiskRow) => a.name.localeCompare(b.name),
      active: (a: RiskRow, b: RiskRow) => a.daysInactive - b.daysInactive,
    }[sort.key];
    return [...list].sort((a, b) => cmp(a, b) * sort.dir);
  }, [scopedRisks, tab, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));
  }

  function exportCsv() {
    const header = ["Trainee", "Society", "District", "State", "Status", "Last active (days)", "Why"];
    const body = rows.map((r) => [r.name, r.society, r.district, r.state, levelMeta[r.level].label, r.daysInactive, r.factors.join(". ")]);
    const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `sahkar-setu-risk-list-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    {
      label: "Trainees trained",
      value: nf.format(trained),
      Icon: GraduationCap,
      foot: <Delta value={trainedDelta} unit="%" label={compareLabel} />,
    },
    {
      label: "Certification rate",
      value: `${certRate.toFixed(0)}%`,
      Icon: Award,
      foot: <Delta value={certDelta} unit="pts" label={compareLabel} />,
    },
    {
      label: "Placed in work",
      value: `${placedRate.toFixed(0)}%`,
      Icon: Briefcase,
      foot: (
        <p className="mt-3 text-[0.75rem] text-ink-faint">
          {stateFilter === "all" ? `Across ${states.length} states` : `In ${stateFilter}`}
        </p>
      ),
    },
    {
      label: "Need a call",
      value: String(counts.high),
      Icon: PhoneCall,
      urgent: counts.high > 0,
      foot: (
        <p className="mt-3 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
          {counts.high > 0 ? (
            <>
              <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
              Trainees at high risk of dropping out
            </>
          ) : (
            "No one is at high risk"
          )}
        </p>
      ),
    },
  ];

  const th = "bg-canvas py-2.5 text-[0.6875rem] font-semibold tracking-[0.04em] whitespace-nowrap text-ink-faint uppercase";

  return (
    <div className="space-y-6">
      {/* Header + filter bar */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[0.8125rem] text-ink-faint">
            <span>Insights</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-ink-soft">Programme overview</span>
          </nav>
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">Programme insights</h1>
          <p className="mt-1 text-[0.875rem] text-ink-soft">
            {rangeLabel}, {stateFilter === "all" ? "all states" : stateFilter}
          </p>
        </div>

        <div className="relative -mx-4 flex w-[calc(100%+2rem)] min-w-0 items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:px-0 sm:pb-0">
          <div role="group" aria-label="Period" className="flex shrink-0 rounded-lg bg-surface p-0.5 ring-1 ring-line">
            {([3, 6] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors ${
                  period === p ? "bg-[var(--brand-dark)] text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                Last {p} months
              </button>
            ))}
          </div>
          <label className="relative shrink-0">
            <span className="sr-only">State</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg bg-surface pr-8 pl-3 text-[0.8125rem] font-medium ring-1 ring-line transition-shadow hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:outline-none"
            >
              <option value="all">All states</option>
              {states.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          </label>
          <button type="button" onClick={exportCsv} className="btn btn-ghost h-9 min-h-0 shrink-0 gap-1.5 px-3 text-[0.8125rem]">
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <dl className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel flex flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-[0.8125rem] font-medium text-ink-soft">{k.label}</dt>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ${k.urgent ? "bg-danger-wash text-danger" : "bg-accent-wash text-accent"}`}
                aria-hidden="true"
              >
                <k.Icon className="size-4" />
              </span>
            </div>
            <dd className="num mt-2 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-[2rem]">{k.value}</dd>
            <dd className="mt-auto">{k.foot}</dd>
          </div>
        ))}
      </dl>

      {/* Charts */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="panel min-w-0 p-5 sm:p-6">
          <TrendChart
            key={period}
            title="Trainees per month"
            data={shown}
            x="month"
            series={[
              { key: "trained", label: "Trained", color: "var(--series-1)" },
              { key: "certified", label: "Certified", color: "var(--series-2)", dashed: true },
            ]}
            footer={stateFilter === "all" ? "Demo data, national" : "National trend: monthly data isn't split by state yet"}
          />
        </section>
        <section id="placement" className="panel p-5 sm:p-6">
          <RankedBars
            title="Placement rate by state"
            rows={placement}
            flagged={showLow ? new Set(lowStates) : undefined}
            flagLabel={`Under ${LOW_PLACEMENT}%`}
            selected={stateFilter === "all" ? null : stateFilter}
          />
        </section>
      </div>

      {/* Insight */}
      {lowStates.length > 0 && (
        <section
          aria-labelledby="insight"
          className="flex flex-col gap-4 rounded-xl bg-accent-wash p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex gap-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-dark)] text-[#daf1de]" aria-hidden="true">
              <Lightbulb className="size-[1.125rem]" />
            </span>
            <div>
              <h2 id="insight" className="font-semibold text-[var(--brand-dark)]">
                {lowStates.length} {lowStates.length === 1 ? "state places" : "states place"} under {LOW_PLACEMENT}% of trainees
              </h2>
              <p className="mt-1 text-[0.875rem] text-[#163832]">
                {listNames(lowStates)} lag behind. Plan employer drives and apprenticeship tie-ups there first.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-pressed={showLow}
            onClick={() => {
              setShowLow((v) => !v);
              if (!showLow) document.getElementById("placement")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="btn btn-primary h-9 min-h-0 shrink-0 self-start px-4 text-[0.8125rem] sm:self-auto"
          >
            {showLow ? "Hide on chart" : "Show on chart"}
          </button>
        </section>
      )}

      {/* Risk table */}
      <section aria-labelledby="risk" className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="risk" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
              Who might drop out
            </h2>
            <p className="mt-1 text-[0.8125rem] text-ink-soft">From attendance, quiz trend and days since last activity. Each row says why.</p>
          </div>
          <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-lg bg-canvas p-1">
            {(
              [
                ["all", "All"],
                ["high", "Call today"],
                ["watch", "Watch"],
                ["low", "On track"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-md px-2.5 py-1 text-[0.8125rem] font-medium whitespace-nowrap transition-colors ${
                  tab === k ? "bg-surface text-ink shadow-[var(--shadow-card)] ring-1 ring-line" : "text-ink-soft hover:text-ink"
                }`}
              >
                {label} <span className="num ml-0.5 text-ink-faint">{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative -mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-[0.875rem]">
            <thead>
              <tr>
                <th scope="col" className={`${th} rounded-l-lg pr-4 pl-3`} aria-sort={sort.key === "name" ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                    Trainee <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className={`${th} pr-4`} aria-sort={sort.key === "risk" ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort("risk")} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                    Status <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className={`${th} pr-4`}>
                  Why
                </th>
                <th scope="col" className={`${th} pr-4`} aria-sort={sort.key === "active" ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort("active")} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                    Last active <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className={`${th} rounded-r-lg pr-3`}>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = levelMeta[r.level];
                return (
                  <tr key={r.id} className="group align-top">
                    <td className="border-b border-line py-3.5 pr-4 pl-3 group-last:border-0">
                      <div className="flex items-start gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-wash text-[0.75rem] font-semibold text-[var(--brand-dark)]" aria-hidden="true">
                          {initials(r.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{r.name}</span>
                          <span className="block text-[0.8125rem] text-ink-faint">
                            {r.society}, {r.state}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-line py-3.5 pr-4 group-last:border-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold whitespace-nowrap ${meta.cls}`}>
                        <meta.Icon className="size-3.5" aria-hidden="true" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="max-w-md border-b border-line py-3.5 pr-4 text-[0.8125rem] text-ink-soft group-last:border-0">{r.factors.join(". ")}</td>
                    <td className="num border-b border-line py-3.5 pr-4 whitespace-nowrap text-ink-soft group-last:border-0">
                      {r.daysInactive === 0 ? "Today" : r.daysInactive === 1 ? "1 day ago" : `${r.daysInactive} days ago`}
                    </td>
                    <td className="border-b border-line py-3 pr-3 text-right group-last:border-0">
                      <a
                        href={`tel:${r.phone}`}
                        className={`btn h-8 min-h-0 gap-1.5 px-3 text-[0.8125rem] ${r.level === "high" ? "btn-primary" : "btn-ghost"}`}
                        aria-label={`Call ${r.name}`}
                      >
                        <Phone className="size-3.5" aria-hidden="true" />
                        Call
                      </a>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-soft">
                    No trainees in this view. Try another status or state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Exam activity */}
      <section aria-labelledby="exam-activity" className="panel p-5 sm:p-6">
        <h2 id="exam-activity" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
          Exam activity
        </h2>
        <p className="mt-1 text-[0.8125rem] text-ink-soft">
          From monitored exams: how often each trainee left the exam screen, for how long, and whether they pasted text.
        </p>
        {exams.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-line-strong px-6 py-8 text-center">
            <p className="font-medium">No monitored exams yet</p>
            <p className="mx-auto mt-1 max-w-md text-[0.8125rem] text-ink-soft">
              When trainees take the final assessment, each one appears here with how often they left the exam screen.
            </p>
          </div>
        ) : (
          <div className="relative -mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[36rem] border-separate border-spacing-0 text-left text-[0.875rem]">
              <thead>
                <tr>
                  <th scope="col" className={`${th} rounded-l-lg pr-4 pl-3`}>Trainee</th>
                  <th scope="col" className={`${th} pr-4`}>Left the exam</th>
                  <th scope="col" className={`${th} pr-4`}>Time away</th>
                  <th scope="col" className={`${th} pr-4`}>Pasted</th>
                  <th scope="col" className={`${th} rounded-r-lg pr-3`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.key} className="group">
                    <td className="border-b border-line py-3 pr-4 pl-3 font-semibold group-last:border-0">
                      {e.name}
                      {!e.submitted && <span className="ml-2 text-[0.75rem] font-normal text-ink-faint">in progress</span>}
                    </td>
                    <td className="num border-b border-line py-3 pr-4 group-last:border-0">{e.left === 1 ? "once" : `${e.left} times`}</td>
                    <td className="num border-b border-line py-3 pr-4 group-last:border-0">{e.awaySec}s</td>
                    <td className="num border-b border-line py-3 pr-4 group-last:border-0">{e.pastes}</td>
                    <td className="border-b border-line py-3 pr-3 group-last:border-0">
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
  );
}
