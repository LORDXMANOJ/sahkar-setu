"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Sparkles, Volume2, X } from "lucide-react";
import { speechTag } from "@/lib/i18n/dictionaries";
import { useI18n } from "../providers";

type Msg = { role: "user" | "assistant"; content: string };


type Recognition = {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function Assistant() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);

  const trigger = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    // Feature detection has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanListen(Boolean(getRecognition()));
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
     
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  function close() {
    abort.current?.abort();
    recognition.current?.stop();
    window.speechSynthesis?.cancel();
    setOpen(false);
    trigger.current?.focus();
  }

  async function send(text: string) {
    const content = text.trim().slice(0, 1200);
    if (!content || busy) return;
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);

    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history.slice(-15) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? t.assistant.error);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        // Models sometimes add markdown anyway; show it as plain text.
        answer = answer.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/^\s*[-*]\s+/gm, "• ");
        setMessages([...history, { role: "assistant", content: answer }]);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMessages(history);
      setError(e instanceof Error ? e.message : t.assistant.error);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    const Rec = getRecognition();
    if (!Rec) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new Rec();
    rec.lang = speechTag(locale);
    rec.interimResults = true;
    rec.onresult = (e) => {
      const text = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((r) => r[0].transcript)
        .join("");
      setInput(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  }

  function speak(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechTag(locale);
    u.rate = 0.95;
    synth.speak(u);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="sahayak"
        aria-label={t.assistant.open}
        className={`btn btn-primary fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 size-14 p-0 shadow-[var(--shadow-lift)] sm:h-13 sm:w-auto sm:px-5 lg:right-8 lg:bottom-8 ${
          open ? "pointer-events-none scale-90 opacity-0" : ""
        }`}
      >
        <Sparkles className="size-6 sm:size-5" aria-hidden="true" />
        <span className="hidden sm:inline">{t.assistant.open}</span>
      </button>

      <section
        id="sahayak"
        role="dialog"
        aria-modal="false"
        aria-label={t.assistant.title}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[min(85dvh,40rem)] flex-col rounded-t-3xl bg-surface shadow-[0_-20px_60px_-20px_rgb(14_19_48/0.5)] ring-1 ring-line [transform-origin:bottom_right] data-[open=true]:animate-[sheet-in_320ms_var(--ease-out-quint)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[25rem] sm:rounded-xl lg:right-8 lg:bottom-8"
        data-open={open}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid size-9 place-items-center rounded-full bg-warn text-[#16204a]">
            <Sparkles className="size-[1.125rem]" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <h2 className="font-semibold">{t.assistant.title}</h2>
            <p className="text-xs text-ink-faint">{t.assistant.subtitle}</p>
          </div>
          <button type="button" onClick={close} className="ml-auto grid size-10 place-items-center rounded-full hover:bg-line/60" aria-label={t.assistant.close}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div ref={scroller} className="scroll-quiet flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5" data-lenis-prevent data-no-translate aria-live="polite">
          {messages.length === 0 && (
            <div className="space-y-2">
              {t.assistant.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="block w-full rounded-xl bg-canvas px-4 py-3 text-left text-sm font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--ink)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-md bg-accent px-4 py-2.5 text-[0.9375rem] text-white dark:text-[#0e1330]">
                {m.content}
              </p>
            ) : (
              <div key={i} className="group max-w-[92%]">
                <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line">
                  {m.content}
                  {busy && i === messages.length - 1 && <span className="caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ink" />}
                </p>
                {m.content && !(busy && i === messages.length - 1) && (
                  <button
                    type="button"
                    onClick={() => speak(m.content)}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-ink-soft hover:bg-line/60 hover:text-ink"
                  >
                    <Volume2 className="size-3.5" aria-hidden="true" />
                    Listen
                  </button>
                )}
              </div>
            ),
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-danger-wash px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {canListen && (
            <button
              type="button"
              onClick={toggleMic}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${listening ? "bg-danger text-white" : "hover:bg-line/60"}`}
            >
              <Mic className="size-5" aria-hidden="true" />
            </button>
          )}
          <label htmlFor="sahayak-input" className="sr-only">
            {t.assistant.placeholder}
          </label>
          <textarea
            id="sahayak-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={1200}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={t.assistant.placeholder}
            className="field max-h-32 min-h-11 flex-1 resize-none py-2.5 leading-snug [field-sizing:content]"
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label={t.assistant.send} className="btn btn-primary size-11 shrink-0 p-0">
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </>
  );
}
