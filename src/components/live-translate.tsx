"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n/dictionaries";
import { loadPhrases, savePack } from "@/lib/i18n/client-packs";

// Translates every visible piece of text on the page, not only the strings in
// the dictionary: lesson content, job posts, table cells, placeholders.
// It only ever changes text values (never HTML), so translated text can't inject markup.

const SKIP = "script,style,noscript,code,pre,textarea,input,select,svg,[data-no-translate],[contenteditable]";
const ATTRS = ["placeholder", "aria-label", "title"] as const;
const LETTER = /\p{L}{2,}/u;
const ID_LIKE = /^(NCCT-|SS-|J-)[\w-]+$|^[\d\s.,:%₹/+-]+$/;

type OnDevice = { translate(text: string): Promise<string> };

async function onDeviceTranslator(target: string): Promise<OnDevice | null> {
  // Chrome's built-in Translator API downloads its own language model and runs offline.
  const T = (globalThis as unknown as {
    Translator?: {
      availability(o: object): Promise<string>;
      create(o: object): Promise<OnDevice>;
    };
  }).Translator;
  if (!T) return null;
  try {
    const opts = { sourceLanguage: "en", targetLanguage: target };
    const a = await T.availability(opts);
    if (a === "unavailable") return null;
    return await T.create(opts);
  } catch {
    return null;
  }
}

export function LiveTranslate({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (locale === "en") return;
    const phrases = loadPhrases(locale);
    const original = new WeakMap<Node, string>(); // node → English source it was translated from
    const pending = new Map<string, Array<() => void>>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let device: OnDevice | null | undefined;
    let stopped = false;

    const wanted = (text: string) => {
      const t = text.trim();
      return t.length > 1 && t.length <= 500 && LETTER.test(t) && !ID_LIKE.test(t) && /[A-Za-z]/.test(t);
    };

    function apply(node: Text | Element, source: string, attr?: string) {
      const translated = phrases[source.trim()];
      if (!translated) return false;
      if (attr) {
        (node as Element).setAttribute(attr, translated);
      } else {
        const lead = source.match(/^\s*/)![0];
        const tail = source.match(/\s*$/)![0];
        (node as Text).nodeValue = lead + translated + tail;
      }
      return true;
    }

    function queue(source: string, done: () => void) {
      const key = source.trim();
      if (!pending.has(key)) pending.set(key, []);
      pending.get(key)!.push(done);
      timer ??= setTimeout(flush, 120);
    }

    async function flush() {
      timer = null;
      const batch = [...pending.keys()].slice(0, 80);
      if (!batch.length || stopped) return;
      const callbacks = batch.map((k) => pending.get(k)!);
      batch.forEach((k) => pending.delete(k));

      let results: string[] | null = null;
      if (navigator.onLine) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang: locale, texts: batch }),
          });
          const json = await res.json();
          if (res.ok && json.live) results = json.translations;
        } catch {
          // offline or server down
        }
      }
      if (!results) {
        if (device === undefined) device = await onDeviceTranslator(locale);
        if (device) results = await Promise.all(batch.map((b) => device!.translate(b).catch(() => b)));
      }
      if (results && !stopped) {
        const fresh: Record<string, string> = {};
        batch.forEach((b, i) => {
          if (results![i] && results![i] !== b) phrases[b] = fresh[b] = results![i];
        });
        savePack(locale, fresh);
        callbacks.flat().forEach((cb) => cb());
      }
      if (pending.size) timer = setTimeout(flush, 50);
    }

    function visit(root: Node) {
      const el = root.nodeType === Node.ELEMENT_NODE ? (root as Element) : root.parentElement;
      if (!el || el.closest(SKIP)) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) =>
          n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      for (let n: Node | null = walker.currentNode; n; n = walker.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) {
          const text = n as Text;
          const value = text.nodeValue ?? "";
          // Skip what we already translated, unless React has since replaced it.
          const prev = original.get(text);
          if (prev !== undefined && value !== prev && phrases[prev.trim()] && value.includes(phrases[prev.trim()])) continue;
          if (!wanted(value)) continue;
          original.set(text, value);
          if (!apply(text, value)) queue(value, () => text.nodeValue === value && apply(text, value));
        } else {
          const elem = n as Element;
          for (const attr of ATTRS) {
            const v = elem.getAttribute(attr);
            if (v && wanted(v) && !Object.values(phrases).includes(v)) {
              if (!apply(elem, v, attr)) queue(v, () => elem.getAttribute(attr) === v && apply(elem, v, attr));
            }
          }
        }
      }
    }

    visit(document.body);
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "characterData") visit(r.target);
        else r.addedNodes.forEach((n) => visit(n));
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => {
      stopped = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [locale]);

  return null;
}
