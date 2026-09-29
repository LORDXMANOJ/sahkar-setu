import Link from "next/link";
import { BadgeCheck, Check, QrCode } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** A static preview of the trainee app, drawn with the app's own styles. */
function ProductPreview() {
  const matches = [
    { title: "Milk collection centre in-charge", org: "Kaveri Milk Producers' Union", score: 100 },
    { title: "Quality lab assistant", org: "Sabar Dairy Cooperative", score: 92 },
    { title: "SHG federation accountant", org: "Maa Tarini SHG Federation", score: 83 },
  ];
  return (
    <div className="relative" aria-hidden="true">
      <div className="panel overflow-hidden shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 truncate rounded-md bg-canvas px-2.5 py-0.5 text-xs text-ink-faint">sahkarsetu.in/app</span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-ink-faint">Namaste,</p>
              <p className="text-lg font-semibold">Lakshmi Devi</p>
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="text-xs font-medium text-ink-faint">Today, 11:15</p>
              <p className="mt-0.5 text-sm font-medium">Adulteration strip tests</p>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-accent-wash px-2.5 py-2 text-xs font-medium text-accent">
                <QrCode className="size-3.5" />
                Code <span className="num font-semibold tracking-widest">K7P-4QX</span>
              </div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="text-xs font-medium text-ink-faint">Skill Passport</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                <BadgeCheck className="size-4 text-ok" />
                Milk quality testing
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <BadgeCheck className="size-4 text-ok" />
                SHG bookkeeping
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs font-medium text-ink-faint">Best matches</p>
            <ul className="mt-2 divide-y divide-line">
              {matches.map((m) => (
                <li key={m.title} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{m.org}</span>
                  </span>
                  <span className="num shrink-0 rounded-md bg-ok-wash px-1.5 py-0.5 text-xs font-semibold text-ok">{m.score}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({ t }: { t: Dictionary }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8">
        <div className="rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="size-1.5 rounded-full bg-ok" />
            {t.brandTag}
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t.hero.title}</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">{t.hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary h-11 px-5" transitionTypes={["nav-forward"]}>
              {t.hero.primary}
            </Link>
            <Link href="/verify" className="btn btn-ghost h-11 px-5" transitionTypes={["nav-forward"]}>
              {t.hero.secondary}
            </Link>
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-ink-soft">
            {t.hero.facts.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-ok" aria-hidden="true" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rise [animation-delay:100ms]">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
