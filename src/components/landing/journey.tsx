"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PassportPage, type PassportStamp } from "../passport";
import { Stamp } from "../stamp";
import { useI18n } from "../providers";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const places = ["Borsad society", "RICM Gandhinagar", "Saved offline", "NCCT", "Kaveri Union"];
const dates = ["02 JUN 2026", "22 JUN 2026", "24 JUN 2026", "26 JUN 2026", "18 SEP 2026"];
const tones: PassportStamp["tone"][] = ["ink", "accent", "warn", "ok", "danger"];

/** Press one stamp: a fast drop, a slight squash on impact, a settle. */
function pressTimeline(stamp: Element, paper: Element | null) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(
    stamp,
    { opacity: 0, scale: 1.9, y: -18, filter: "blur(2px)" },
    { opacity: 1, scale: 0.94, y: 0, filter: "blur(0px)", duration: 0.26, ease: "power4.in" },
  ).to(stamp, { scale: 1, duration: 0.22, ease: "back.out(3)" });
  if (paper) tl.fromTo(paper, { y: 0 }, { y: 3, duration: 0.06, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.24);
  return tl;
}

export function Journey() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  const stamps: PassportStamp[] = t.journey.steps.map((s, i) => ({
    label: s.stamp,
    place: places[i],
    date: dates[i],
    tone: tones[i],
  }));

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
          const paper = desktop ? root.current!.querySelector("[data-sticky] [data-passport]") : null;

          steps.forEach((step, i) => {
            const target = desktop
              ? root.current!.querySelector(`[data-sticky] [data-stamp="${i}"]`)
              : step.querySelector("[data-inline-stamp]");
            if (!target) return;

            gsap.set(target, { opacity: 0 });
            const tl = motion
              ? pressTimeline(target, paper)
              : gsap.timeline({ paused: true }).to(target, { opacity: 1, duration: 0.2 });

            ScrollTrigger.create({
              trigger: step,
              start: desktop ? "top 62%" : "top 78%",
              end: "bottom 62%",
              onEnter: () => tl.play(),
              onLeaveBack: () => tl.reverse(),
              toggleClass: desktop ? { targets: step, className: "is-active" } : undefined,
            });
          });
        },
      );
    },
    { scope: root, dependencies: [t] , revertOnUpdate: true },
  );

  return (
    <section ref={root} aria-labelledby="journey-title" className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <h2 id="journey-title" className="display text-3xl sm:text-4xl">
            {t.journey.title}
          </h2>
          <p className="mt-5 text-lg text-ink-soft">{t.journey.body}</p>
        </div>

        <div className="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-2 lg:gap-20">
          <div className="hidden lg:block">
            <div data-sticky className="sticky top-28">
              <PassportPage
                labels={t.passport}
                holder="Lakshmi Devi"
                society="Borsad Milk Producers' Cooperative"
                passportId="SS-26-04817"
                stamps={stamps}
              />
            </div>
          </div>

          <ol className="relative">
            {t.journey.steps.map((s, i) => (
              <li
                key={s.stamp}
                data-step
                className="group relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 pb-16 transition-opacity duration-500 last:pb-0 lg:min-h-[62vh] lg:pb-0 lg:opacity-35 lg:[&.is-active]:opacity-100"
              >
                {/* Timeline rail: a real sequence, so it earns its numbers. */}
                <div className="flex flex-col items-center">
                  <span className="num grid size-10 place-items-center rounded-full bg-canvas text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--line-strong)] transition-colors duration-500 group-[.is-active]:bg-ink group-[.is-active]:text-canvas">
                    {i + 1}
                  </span>
                  {i < t.journey.steps.length - 1 && <span className="mt-2 w-px flex-1 bg-line-strong" aria-hidden="true" />}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 max-w-md text-ink-soft">{s.body}</p>
                  <div data-inline-stamp className="mt-6 w-36 lg:hidden" style={{ rotate: `${i % 2 ? 6 : -7}deg` }}>
                    <Stamp {...stamps[i]} className="h-auto w-full" />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
