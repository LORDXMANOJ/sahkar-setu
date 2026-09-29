"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eye, ShieldCheck, X } from "lucide-react";
import type { Lesson } from "@/lib/data";
import { DEMO_TRAINEE_ID, trainees } from "@/lib/data";

type Q = Lesson["quiz"][number];
type EventType = "started" | "left" | "returned" | "blur" | "fullscreen-exit" | "paste" | "copy" | "submitted";
type Ev = { id: string; type: EventType; at: number; awayMs?: number };

const EXAM_ID = "milk-quality-final";

/**
 * Records what a web page can honestly see during an exam: leaving the exam
 * screen or app, exiting fullscreen, and copy/paste. It can't see other apps.
 */
function useIntegrityLog(active: boolean, traineeId: string) {
  const queue = useRef<Ev[]>([]);
  const leftAt = useRef<number | null>(null);
  const [counts, setCounts] = useState({ left: 0, awayMs: 0, pastes: 0 });

  const log = useCallback((type: EventType, awayMs?: number) => {
    queue.current.push({ id: crypto.randomUUID(), type, at: Date.now(), awayMs });
  }, []);

  const flush = useCallback(async () => {
    if (!queue.current.length) return;
    const events = queue.current.splice(0, 200);
    try {
      const res = await fetch("/api/integrity", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: EXAM_ID, traineeId, events }),
      });
      if (!res.ok) throw new Error();
    } catch {
      queue.current.unshift(...events); // offline: retry on the next tick
    }
  }, [traineeId]);

  useEffect(() => {
    if (!active) return;
    const away = () => {
      if (leftAt.current !== null) return;
      leftAt.current = Date.now();
      log("left");
      setCounts((c) => ({ ...c, left: c.left + 1 }));
    };
    const back = () => {
      if (leftAt.current === null) return;
      const ms = Date.now() - leftAt.current;
      leftAt.current = null;
      log("returned", ms);
      setCounts((c) => ({ ...c, awayMs: c.awayMs + ms }));
    };
    const onVisibility = () => (document.hidden ? away() : back());
    const onBlur = () => {
      // A blur without the page hiding: another window or an overlay app took focus.
      setTimeout(() => !document.hasFocus() && !document.hidden && away(), 400);
    };
    const onFocus = () => back();
    const onFs = () => !document.fullscreenElement && log("fullscreen-exit");
    const onPaste = () => {
      log("paste");
      setCounts((c) => ({ ...c, pastes: c.pastes + 1 }));
    };
    const onCopy = () => log("copy");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    const timer = setInterval(flush, 4000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      clearInterval(timer);
      flush();
    };
  }, [active, log, flush]);

  return { log, flush, counts };
}

export function Exam({ questions }: { questions: Q[] }) {
  const [phase, setPhase] = useState<"consent" | "running" | "done">("consent");
  const [who, setWho] = useState(DEMO_TRAINEE_ID);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [note, setNote] = useState("");
  const { log, flush, counts } = useIntegrityLog(phase === "running", who);
  const score = answers.filter((a, i) => a === questions[i].answer).length;

  async function begin() {
    setPhase("running");
    log("started");
    try {
      await document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
    } catch {
      // Fullscreen isn't available everywhere (e.g. iPhone Safari); the log still works.
    }
  }

  async function submit() {
    log("submitted");
    await flush();
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    setPhase("done");
  }

  if (phase === "consent") {
    return (
      <div className="panel max-w-xl p-6">
        <ShieldCheck className="size-8 text-accent" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">Before you start</h2>
        <p className="mt-2 text-ink-soft">This is a monitored exam. While it is open, your trainer will see:</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {["How many times you leave this screen or switch apps, and for how long", "If you leave fullscreen", "If you paste text into an answer"].map((x) => (
            <li key={x} className="flex gap-2">
              <Eye className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden="true" />
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-faint">Nothing else on your phone is seen or recorded.</p>
        <div className="mt-5">
          <label htmlFor="ex-who" className="mb-1.5 block text-sm font-medium">
            Your name <span className="font-normal text-ink-faint">(demo)</span>
          </label>
          <select id="ex-who" className="field" value={who} onChange={(e) => setWho(e.target.value)}>
            {trainees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={begin} className="btn btn-primary mt-6 w-full">
          I understand, start the exam
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="panel max-w-xl p-6" role="status">
        <p className="text-sm text-ink-soft">Submitted</p>
        <p className="mt-1 text-3xl font-semibold">
          <span className="num">{score}</span> of {questions.length} correct
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Your trainer can see that you left the exam screen{" "}
          <span className="num font-medium text-ink">{counts.left === 1 ? "once" : `${counts.left} times`}</span>
          {counts.pastes ? `, and pasted text ${counts.pastes === 1 ? "once" : `${counts.pastes} times`}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 py-3 text-sm backdrop-blur lg:top-0">
        <span className="flex items-center gap-2 font-medium">
          <span className="live-dot inline-block size-2 rounded-full bg-danger text-danger" />
          Monitored exam
        </span>
        <span className="text-ink-soft">
          Left screen <span className="num font-semibold text-ink">{counts.left}</span>
        </span>
      </div>

      <ol className="space-y-8">
        {questions.map((q, qi) => (
          <li key={qi}>
            <fieldset>
              <legend className="font-medium">
                <span className="num mr-2 text-ink-faint">{qi + 1}.</span>
                {q.q}
              </legend>
              <div className="mt-3 grid gap-2">
                {q.options.map((o, oi) => (
                  <label
                    key={oi}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors ${
                      answers[qi] === oi ? "bg-accent-wash ring-accent" : "bg-surface ring-line hover:ring-line-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                      className="size-4 accent-[var(--accent)]"
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
        <li>
          <label htmlFor="ex-note" className="font-medium">
            In your own words: why does milk need chilling quickly?
          </label>
          <textarea id="ex-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="field mt-3 py-2" maxLength={1000} />
        </li>
      </ol>

      <button type="button" onClick={submit} disabled={answers.some((a) => a === null)} className="btn btn-primary mt-8 h-12 w-full text-base">
        Submit exam
      </button>
    </div>
  );
}

export function IntegrityBadge({ left, pastes }: { left: number; pastes: number }) {
  const clean = left === 0 && pastes === 0;
  return clean ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-ok-wash px-2 py-0.5 text-xs font-medium text-ok">
      <Check className="size-3.5" aria-hidden="true" />
      Stayed on exam
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-warn-wash px-2 py-0.5 text-xs font-medium text-warn-deep">
      <X className="size-3.5" aria-hidden="true" />
      Needs review
    </span>
  );
}
