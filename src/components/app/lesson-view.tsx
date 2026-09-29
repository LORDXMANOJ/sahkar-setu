"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Pause, Volume2, X } from "lucide-react";
import type { Lesson } from "@/lib/data";
import { enqueue, flushQueue, markLessonDone } from "@/lib/offline-queue";

export function LessonView({ lesson, number, of, nextId }: { lesson: Lesson; number: number; of: number; nextId?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [saved, setSaved] = useState<"idle" | "synced" | "queued">("idle");

  const answered = answers.every((a) => a !== null);
  const score = answers.filter((a, i) => a === lesson.quiz[i].answer).length;

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggleListen() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance([lesson.title, ...lesson.body].join(". "));
    u.lang = "en-IN";
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  }

  async function choose(qi: number, oi: number) {
    if (answers[qi] !== null) return;
    const nextAnswers = answers.map((a, i) => (i === qi ? oi : a));
    setAnswers(nextAnswers);

    if (nextAnswers.every((a) => a !== null)) {
      const final = nextAnswers.filter((a, i) => a === lesson.quiz[i].answer).length;
      markLessonDone(lesson.id, final);
      enqueue({ lessonId: lesson.id, score: final, total: lesson.quiz.length });
      if (navigator.onLine) {
        await flushQueue();
        setSaved("synced");
      } else {
        setSaved("queued");
      }
    }
  }

  return (
    <article className="mx-auto mt-6 max-w-2xl">
      <p className="num text-sm font-medium text-ink-faint">
        Lesson {number} of {of}, {lesson.minutes} min
      </p>
      <h1 className="display mt-2 text-2xl sm:text-3xl">{lesson.title}</h1>

      <button type="button" onClick={toggleListen} aria-pressed={speaking} className="btn btn-ghost mt-6">
        {speaking ? <Pause className="size-[1.125rem]" aria-hidden="true" /> : <Volume2 className="size-[1.125rem]" aria-hidden="true" />}
        {speaking ? "Stop reading" : "Read this lesson aloud"}
      </button>

      <div className="mt-8 space-y-5 text-[1.125rem] leading-[1.75]">
        {lesson.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <section aria-labelledby="quiz" className="mt-12 border-t border-line pt-10">
        <h2 id="quiz" className="text-xl font-semibold">
          Check what you learned
        </h2>

        <ol className="mt-6 space-y-8">
          {lesson.quiz.map((q, qi) => {
            const picked = answers[qi];
            return (
              <li key={qi}>
                <fieldset>
                  <legend className="font-semibold">{q.q}</legend>
                  <div className="mt-3 grid gap-2">
                    {q.options.map((o, oi) => {
                      const isPicked = picked === oi;
                      const isRight = q.answer === oi;
                      const state =
                        picked === null ? "idle" : isRight ? "right" : isPicked ? "wrong" : "muted";
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={picked !== null}
                          onClick={() => choose(qi, oi)}
                          aria-pressed={isPicked}
                          className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left font-medium transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.99] ${
                            state === "idle"
                              ? "bg-surface shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
                              : state === "right"
                                ? "bg-ok-wash text-ok shadow-[inset_0_0_0_1.5px_var(--ok)]"
                                : state === "wrong"
                                  ? "bg-danger-wash text-danger shadow-[inset_0_0_0_1.5px_var(--danger)]"
                                  : "bg-surface text-ink-faint shadow-[inset_0_0_0_1px_var(--line)]"
                          }`}
                        >
                          {o}
                          {state === "right" && <Check className="size-5 shrink-0" aria-label="Correct answer" />}
                          {state === "wrong" && <X className="size-5 shrink-0" aria-label="Your answer, incorrect" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <p className="rise mt-3 text-sm text-ink-soft" role="status">
                      {picked === q.answer ? "Right. " : "Not quite. "}
                      {q.why}
                    </p>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {answered && (
          <div className="rise mt-10 rounded-xl bg-ink p-6 text-canvas" role="status">
            <p className="display text-2xl">
              <span className="num">{score}</span> of {lesson.quiz.length} correct
            </p>
            <p className="mt-2 text-sm opacity-80">
              {saved === "queued"
                ? "Saved on this phone. It will sync when you're back online."
                : "Saved to your Skill Passport."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {nextId ? (
                <Link href={`/app/learn/${nextId}`} transitionTypes={["nav-forward"]} className="btn bg-warn text-[#16204a]">
                  Next lesson
                </Link>
              ) : (
                <Link href="/app/jobs" transitionTypes={["nav-forward"]} className="btn bg-warn text-[#16204a]">
                  See jobs that use these skills
                </Link>
              )}
              <Link href="/app/learn" transitionTypes={["nav-back"]} className="btn text-canvas shadow-[inset_0_0_0_1px_color-mix(in_srgb,currentColor_35%,transparent)]">
                All lessons
              </Link>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
