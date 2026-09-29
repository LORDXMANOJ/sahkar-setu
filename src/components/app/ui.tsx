import type { ReactNode } from "react";

export function PageHeader({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mt-2 mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="display text-2xl sm:text-3xl">{title}</h1>
        {body && <p className="mt-3 text-ink-soft">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold">{children}</h2>
      {action}
    </div>
  );
}

/** Horizontal meter; the number beside it is the accessible value. */
export function Meter({ value, tone = "accent", label }: { value: number; tone?: "accent" | "ok" | "warn" | "danger"; label: string }) {
  const color = { accent: "bg-accent", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" }[tone];
  return (
    <div role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-line/70">
      <div className={`h-full rounded-full ${color} origin-left transition-[width] duration-700 ease-[var(--ease-out-quint)]`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "accent" }) {
  const cls = {
    neutral: "bg-line/60 text-ink-soft",
    ok: "bg-ok-wash text-ok",
    warn: "bg-warn-wash text-warn-deep",
    danger: "bg-danger-wash text-danger",
    accent: "bg-accent-wash text-accent",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}
