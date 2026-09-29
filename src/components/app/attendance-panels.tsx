"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Copy, RefreshCw, Square, Users, Wifi } from "lucide-react";
import { endSessionAction, rotateCodeAction, startSessionAction } from "@/app/app/attendance/actions";
import { CheckInForm } from "./check-in-form";

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const STORE = "ss.trainer.session";

export function AttendancePanels() {
  const [view, setView] = useState<"trainee" | "trainer">("trainee");

  return (
    <div>
      {/* Phones show one role at a time; wide screens show both side by side. */}
      <div role="group" aria-label="Who is using this screen" className="mb-6 inline-flex rounded-lg bg-line/60 p-1 lg:hidden">
        {(["trainee", "trainer"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${view === v ? "bg-surface text-ink shadow-sm" : "text-ink-soft"}`}
          >
            {v === "trainee" ? "I'm a trainee" : "I'm the trainer"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="trainee-title" className={`panel h-fit p-6 ${view === "trainee" ? "" : "hidden lg:block"}`}>
          <h2 id="trainee-title" className="text-lg font-semibold">Mark yourself present</h2>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            Type the code from the trainer&apos;s screen, open the link they shared, or scan the QR. You must be on the classroom Wi-Fi.
          </p>
          <CheckInForm />
        </section>
        <div className={view === "trainer" ? "" : "hidden lg:block"}>
          <TrainerPanel />
        </div>
      </div>
    </div>
  );
}

type Live = {
  id: string;
  title: string;
  room: string;
  code: string;
  link: string;
  open: boolean;
  requireSameNetwork: boolean;
  qr: { size: number; bits: string };
  present: { id: string; name: string; at: number }[];
  flags: string[];
};

function TrainerPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("Adulteration strip tests");
  const [room, setRoom] = useState("Dairy lab 2");
  const [sameNet, setSameNet] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Remember the running session across reloads of the trainer's screen.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setSessionId(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const res = await fetch(`/api/attendance/session/${sessionId}`, { cache: "no-store" });
        if (res.status === 404) {
          try {
            localStorage.removeItem(STORE);
          } catch {}
          if (alive) {
            setSessionId(null);
            setLive(null);
          }
          return;
        }
        if (res.ok && alive) setLive(await res.json());
      } catch {
        // keep the last state on a network blip
      }
      if (alive) timer = setTimeout(load, 3000);
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [sessionId]);

  const qrPath = useMemo(() => {
    if (!live) return "";
    let d = "";
    for (let y = 0; y < live.qr.size; y++)
      for (let x = 0; x < live.qr.size; x++) if (live.qr.bits[y * live.qr.size + x] === "1") d += `M${x} ${y}h1v1h-1z`;
    return d;
  }, [live]);

  async function refresh() {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/attendance/session/${sessionId}`, { cache: "no-store" });
      if (res.ok) setLive(await res.json());
    } catch {}
  }

  if (!sessionId || !live) {
    return (
      <section aria-labelledby="trainer-title" className="panel p-6">
        <h2 id="trainer-title" className="text-lg font-semibold">Start a class session</h2>
        <p className="mt-1 mb-6 text-sm text-ink-soft">You&apos;ll get one code for the whole session. Show it on the screen or share the link.</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const r = await startSessionAction({ title, room, requireSameNetwork: sameNet });
              if (!r.ok) return setError(r.message);
              try {
                localStorage.setItem(STORE, r.id);
              } catch {}
              setSessionId(r.id);
            });
          }}
        >
          <div>
            <label htmlFor="ts-title" className="mb-1.5 block text-sm font-medium">Session</label>
            <input id="ts-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label htmlFor="ts-room" className="mb-1.5 block text-sm font-medium">Room</label>
            <input id="ts-room" className="field" value={room} onChange={(e) => setRoom(e.target.value)} maxLength={40} />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={sameNet} onChange={(e) => setSameNet(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
            <span>
              <span className="font-medium">Only allow phones on this Wi-Fi</span>
              <span className="block text-ink-soft">Trainees at home or on mobile data can&apos;t mark attendance.</span>
            </span>
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={pending || sessionId !== null} className="btn btn-primary w-full">
            {pending || sessionId ? "Starting…" : "Start session"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="trainer-title" className="panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="trainer-title" className="text-lg font-semibold">{live.title}</h2>
          <p className="text-sm text-ink-soft">{live.room}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${live.open ? "bg-ok-wash text-ok" : "bg-line/60 text-ink-soft"}`}>
          <span className={`size-1.5 rounded-full ${live.open ? "bg-ok" : "bg-ink-faint"}`} />
          {live.open ? "Open" : "Ended"}
        </span>
      </div>

      {live.open && (
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Attendance code</p>
            <p className="num mt-1 text-5xl font-semibold tracking-[0.12em]" data-no-translate>
              {live.code}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-canvas px-2.5 py-1.5 text-xs text-ink-soft" data-no-translate>
                {live.link}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(live.link).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                className="btn btn-ghost h-8 min-h-0 px-2.5 text-xs"
              >
                <Copy className="size-3.5" aria-hidden="true" />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            {live.requireSameNetwork && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
                <Wifi className="size-3.5" aria-hidden="true" />
                Only phones on this network can check in
              </p>
            )}
          </div>
          <svg
            viewBox={`-2 -2 ${live.qr.size + 4} ${live.qr.size + 4}`}
            className="w-40 justify-self-center rounded-lg bg-white"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code for ${live.link}`}
          >
            <path d={qrPath} fill="#18181b" />
          </svg>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {live.open ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await rotateCodeAction(live.id);
                  await refresh();
                })
              }
              className="btn btn-ghost"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              New code
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await endSessionAction(live.id);
                  await refresh();
                })
              }
              className="btn btn-ghost text-danger"
            >
              <Square className="size-4" aria-hidden="true" />
              End session
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(STORE);
              } catch {}
              setSessionId(null);
              setLive(null);
            }}
            className="btn btn-primary"
          >
            Start another session
          </button>
        )}
      </div>

      {live.flags.length > 0 && (
        <ul className="mt-5 space-y-1.5 rounded-lg bg-warn-wash p-3 text-sm">
          {live.flags.map((f, i) => (
            <li key={i} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn-deep" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4" aria-hidden="true" />
          <span className="num">{live.present.length}</span> present
        </p>
        <ul className="mt-3 space-y-1.5 text-sm" aria-live="polite">
          {live.present.map((p) => (
            <li key={p.id} className="rise flex justify-between gap-3">
              <span>{p.name}</span>
              <span className="num text-ink-faint">{timeFmt.format(p.at)}</span>
            </li>
          ))}
          {live.present.length === 0 && <li className="text-ink-faint">No one has checked in yet.</li>}
        </ul>
      </div>
    </section>
  );
}
