import Link from "next/link";
import { CalendarCheck, Headphones, MessagesSquare, QrCode } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { Journey } from "@/components/landing/journey";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { VerifyForm } from "@/components/verify-form";
import { getInstitute, programmes, sectorLabel } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { languages } from "@/lib/i18n/dictionaries";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export default async function Home() {
  const { t } = await getDictionary();
  const [programmesFeat, attendanceFeat, languageFeat, assistantFeat] = t.features.items;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero t={t} />
        <Journey />

        {/* Capabilities. Attendance gets a live demo because it is the one thing
            people won't believe until they see it change. */}
        <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <h2 id="features-title" className="display max-w-3xl text-3xl sm:text-[3rem] sm:leading-[1.02]">
            {t.features.title}
          </h2>

          <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <article className="panel grid gap-8 p-6 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-8">
              <div>
                <QrCode className="size-6 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">{attendanceFeat.title}</h3>
                <p className="mt-3 text-ink-soft">{attendanceFeat.body}</p>
                <Link href="/app/attendance" className="mt-6 inline-flex font-semibold text-accent underline-offset-4 hover:underline">
                  See the trainer and trainee screens
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-canvas p-5 text-center" aria-hidden="true">
                <p className="text-xs text-ink-faint">Today&apos;s code</p>
                <p className="num mt-1 text-3xl font-semibold tracking-[0.12em]">K7P-4QX</p>
                <p className="mt-3 text-xs text-ink-faint">Classroom Wi-Fi only</p>
              </div>
            </article>

            <div className="grid gap-6">
              {[
                { item: programmesFeat, Icon: CalendarCheck },
                { item: languageFeat, Icon: Headphones },
                { item: assistantFeat, Icon: MessagesSquare },
              ].map(({ item, Icon }) => (
                <article key={item.title} className="flex gap-5 border-b border-line pb-6 last:border-0 last:pb-0">
                  <Icon className="mt-1 size-6 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-ink-soft">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Programme calendar: a schedule, so it is a table. */}
        <section id="programmes" aria-labelledby="programmes-title" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="programmes-title" className="display text-3xl">
                {t.nav.programmes}
              </h2>
              <p className="text-sm text-ink-soft">October to November 2026</p>
            </div>

            <div className="mt-10 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line-strong text-ink-faint">
                    <th scope="col" className="py-3 pr-4 font-medium">Starts</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Programme</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Institute</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Languages</th>
                    <th scope="col" className="py-3 text-right font-medium">Seats left</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((p) => {
                    const left = p.seats - p.enrolled;
                    const inst = getInstitute(p.instituteId);
                    return (
                      <tr key={p.slug} className="border-b border-line align-top">
                        <td className="num py-4 pr-4 font-semibold whitespace-nowrap">
                          {dateFmt.format(new Date(p.startsOn))}
                          <span className="block text-xs font-normal text-ink-faint">{p.days} days</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-semibold">{p.title}</span>
                          <span className="block text-xs text-ink-faint">{sectorLabel[p.sector]}{p.hostel ? ", hostel provided" : ""}</span>
                        </td>
                        <td className="py-4 pr-4 text-ink-soft">
                          {inst?.short}
                        </td>
                        <td className="py-4 pr-4 text-ink-soft">{p.languages.map((l) => languages.find((x) => x.code === l)?.native).join(", ")}</td>
                        <td className="num py-4 text-right font-semibold">
                          {left === 0 ? <span className="text-danger">Full</span> : left}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Verification band */}
        <section aria-labelledby="verify-title" className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <h2 id="verify-title" className="display text-3xl sm:text-4xl">
                {t.verify.title}
              </h2>
              <p className="mt-4 max-w-md text-lg text-ink-soft">{t.verify.body}</p>
            </div>
            <VerifyForm />
          </div>
        </section>

        {/* Who uses it */}
        <section aria-labelledby="roles-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <h2 id="roles-title" className="display text-3xl">
            {t.roles.title}
          </h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {t.roles.items.map((r) => (
              <div key={r.who} className="panel p-6">
                <dt className="text-lg font-semibold">{r.who}</dt>
                <dd className="mt-2 text-ink-soft">{r.what}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
