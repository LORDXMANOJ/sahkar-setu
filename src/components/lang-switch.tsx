"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Languages, LoaderCircle, X } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { isBundled, languages, type Locale } from "@/lib/i18n/dictionaries";
import { hasPack, savePack } from "@/lib/i18n/client-packs";
import { useI18n } from "./providers";

const noop = () => () => {};

/** Language picker. Built-in languages switch at once; the others download first. */
export function LangSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<Locale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [version, setVersion] = useState(0);
  // Which packs are saved on this device; re-read after each download.
  const downloaded = useSyncExternalStore(
    noop,
    () => languages.filter((l) => hasPack(l.code)).map((l) => l.code).join(",") + version,
    () => "",
  );
  const current = languages.find((l) => l.code === locale)!;

  useEffect(() => {
    const d = dialog.current;
    const onClick = (e: MouseEvent) => e.target === d && d?.close();
    d?.addEventListener("click", onClick);
    return () => d?.removeEventListener("click", onClick);
  }, []);

  async function choose(code: Locale) {
    setError(null);
    if (code === locale) return dialog.current?.close();
    setBusy(code);
    try {
      if (!isBundled(code) || !hasPack(code)) {
        const res = await fetch(`/api/lang/${code}`);
        const json = await res.json();
        if (!res.ok) {
          // Built-in languages still work without their phrase book.
          if (!isBundled(code)) throw new Error(json.error ?? "Download failed.");
        } else {
          savePack(code, json.phrases ?? {});
          setVersion((v) => v + 1);
        }
      }
      await setLocale(code);
      dialog.current?.close();
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed. Check your connection.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="btn btn-ghost h-9 min-h-0 gap-1.5 px-3">
        <Languages className="size-4 text-ink-soft" aria-hidden="true" />
        <span data-no-translate>{current.native}</span>
        <span className="sr-only">, {t.nav.language}</span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="lang-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-surface p-0 text-ink shadow-[var(--shadow-lift)] ring-1 ring-line backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="lang-title" className="font-semibold">
            {t.nav.language}
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-8 place-items-center rounded-md hover:bg-canvas">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="px-5 pt-4 text-sm text-ink-soft">
          English, Hindi and Tamil are built in. Other languages download once (about 40 KB) and then work offline.
        </p>
        <ul className="grid gap-1 p-3" data-no-translate>
          {languages.map((l) => {
            const saved = isBundled(l.code) || downloaded.includes(l.code);
            const active = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  lang={l.code}
                  disabled={busy !== null}
                  onClick={() => choose(l.code)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                    active ? "bg-accent-wash" : "hover:bg-canvas"
                  }`}
                >
                  <span className="flex-1">
                    <span className="block font-medium">{l.native}</span>
                    <span className="block text-xs text-ink-faint">{l.name}</span>
                  </span>
                  {busy === l.code ? (
                    <LoaderCircle className="size-4 animate-spin text-ink-soft" aria-label="Downloading" />
                  ) : active ? (
                    <Check className="size-4 text-accent" aria-label="Current language" />
                  ) : saved ? (
                    <span className="text-xs text-ink-faint">{isBundled(l.code) ? "Built in" : "Downloaded"}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-accent">
                      <Download className="size-3.5" aria-hidden="true" />
                      Download
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {error && (
          <p role="alert" className="mx-5 mb-4 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </dialog>
    </>
  );
}
