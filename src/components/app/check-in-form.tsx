"use client";

import { useState, useTransition } from "react";
import { CircleCheck, CircleX, QrCode } from "lucide-react";
import { checkIn, type CheckInResult } from "@/app/app/attendance/actions";
import { DEMO_TRAINEE_ID, trainees } from "@/lib/data";
import { QRScanner } from "./qr-scanner";

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" });

/** Formats as the trainee types: uppercase, no confusable characters, dash after 3. */
function formatInput(v: string) {
  const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

export function CheckInForm({ initialCode = "", fromLink = false }: { initialCode?: string; fromLink?: boolean }) {
  const [code, setCode] = useState(formatInput(initialCode));
  // From a link, the code is fixed and already known.
  const [who, setWho] = useState(DEMO_TRAINEE_ID);
  const [scan, setScan] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pending, start] = useTransition();

  function submit(value: string) {
    start(async () => {
      const r = await checkIn(fromLink ? initialCode : value, who);
      setResult(r);
      if (r.ok) setScan(false);
      if ("vibrate" in navigator) navigator.vibrate(r.ok ? 40 : [30, 60, 30]);
    });
  }

  if (result?.ok) {
    return (
      <div className="rise rounded-xl bg-ok-wash p-6 text-center" role="status">
        <CircleCheck className="mx-auto size-12 text-ok" strokeWidth={1.75} aria-hidden="true" />
        <p className="mt-3 text-xl font-semibold">{result.duplicate ? "Already marked present" : "You're marked present"}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {result.name}, {result.title}, {result.room}, <span className="num">{timeFmt.format(result.at)}</span>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(code);
      }}
      className="space-y-5"
    >
      {/* Demo mode only: in production the name comes from the trainee's login. */}
      <div>
        <label htmlFor="ci-who" className="mb-1.5 block text-sm font-medium">
          Your name <span className="font-normal text-ink-faint">(demo)</span>
        </label>
        <select id="ci-who" value={who} onChange={(e) => setWho(e.target.value)} className="field">
          {trainees.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {!fromLink && (
        <div>
          <label htmlFor="ci-code" className="mb-1.5 block text-sm font-medium">
            Attendance code
          </label>
          <input
            id="ci-code"
            value={code}
            onChange={(e) => setCode(formatInput(e.target.value))}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="XXX-XXX"
            aria-describedby="ci-code-help"
            className="field num h-14 text-center text-2xl font-semibold tracking-[0.3em] placeholder:tracking-[0.3em]"
            data-no-translate
          />
          <p id="ci-code-help" className="mt-1.5 text-sm text-ink-faint">
            6 letters and numbers, shown on the trainer&apos;s screen.
          </p>
        </div>
      )}

      <button type="submit" disabled={pending || (!fromLink && code.replace("-", "").length !== 6)} className="btn btn-primary h-12 w-full text-base">
        {pending ? "Marking…" : "Mark me present"}
      </button>

      {result && !result.ok && (
        <p role="alert" className="rise flex items-start gap-2 rounded-lg bg-danger-wash px-3 py-2.5 text-sm text-danger">
          <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {result.message}
        </p>
      )}

      {!fromLink && (
        <div className="border-t border-line pt-4">
          {scan ? (
            <QRScanner onResult={(text) => !pending && submit(text)} paused={pending} />
          ) : (
            <button type="button" onClick={() => setScan(true)} className="btn btn-ghost w-full">
              <QrCode className="size-4" aria-hidden="true" />
              Scan the QR code instead
            </button>
          )}
        </div>
      )}
    </form>
  );
}
