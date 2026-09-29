import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { translateBatch } from "../ai";
import { jobs, lessons, programmes, sectorLabel } from "../data";
import { dictionaries, isBundled, languageName, type Dictionary, type Locale } from "./dictionaries";
import { scriptOf } from "./languages";

// A language pack is the full UI dictionary plus a phrase book (English source
// text → translation) for content and any text translated live. Packs are made
// once with AI, saved to disk, and served to phones, which cache them offline.

// complete: false means only live-translated phrases exist so far, not the full dictionary.
export type Pack = { code: Locale; version: number; complete: boolean; dict: Dictionary; phrases: Record<string, string> };

const DIR = process.env.LANG_CACHE_DIR ?? path.join(process.cwd(), ".cache", "lang");
const MAX_PHRASES = 8000;
const g = globalThis as typeof globalThis & { __ssPacks?: Map<Locale, Pack>; __ssBuilding?: Map<Locale, Promise<Pack>> };
const memory = (g.__ssPacks ??= new Map());
const building = (g.__ssBuilding ??= new Map());

// ---------------------------------------------------------------------------
// Dictionary <-> flat list of strings
// ---------------------------------------------------------------------------

type Tree = string | Tree[] | { [k: string]: Tree };

function flatten(tree: Tree, out: string[] = []): string[] {
  if (typeof tree === "string") out.push(tree);
  else if (Array.isArray(tree)) tree.forEach((t) => flatten(t, out));
  else Object.values(tree).forEach((t) => flatten(t, out));
  return out;
}

function rebuild<T extends Tree>(template: T, values: string[], cursor = { i: 0 }): T {
  if (typeof template === "string") return (values[cursor.i++] ?? template) as T;
  if (Array.isArray(template)) return template.map((t) => rebuild(t, values, cursor)) as T;
  return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, rebuild(v, values, cursor)])) as T;
}

/** Content every trainee sees: lessons, quizzes, programme and job titles. */
function contentStrings() {
  const set = new Set<string>();
  for (const list of Object.values(lessons))
    for (const l of list) {
      set.add(l.title);
      l.body.forEach((b) => set.add(b));
      for (const q of l.quiz) {
        set.add(q.q);
        set.add(q.why);
        q.options.forEach((o) => set.add(o));
      }
    }
  for (const p of programmes) {
    set.add(p.title);
    set.add(p.summary);
    p.skills.forEach((s) => set.add(s));
  }
  for (const j of jobs) set.add(j.title);
  Object.values(sectorLabel).forEach((s) => set.add(s));
  return [...set];
}

// ---------------------------------------------------------------------------
// Disk cache
// ---------------------------------------------------------------------------

async function readPack(code: Locale): Promise<Pack | null> {
  if (memory.has(code)) return memory.get(code)!;
  for (const dir of [DIR, path.join(tmpdir(), "sahkar-lang")]) {
    try {
      const pack = JSON.parse(await readFile(path.join(dir, `${code}.json`), "utf8")) as Pack;
      memory.set(code, pack);
      return pack;
    } catch {
      // not cached here
    }
  }
  return null;
}

async function savePack(pack: Pack) {
  memory.set(pack.code, pack);
  for (const dir of [DIR, path.join(tmpdir(), "sahkar-lang")]) {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${pack.code}.json`), JSON.stringify(pack));
      return;
    } catch {
      // read-only filesystem (e.g. serverless): try the temp dir, else keep in memory
    }
  }
}

async function translateMany(texts: string[], code: Locale) {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += 60) {
    out.push(...(await translateBatch(texts.slice(i, i + 60), languageName(code), scriptOf(code))));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** A fully downloaded pack, or null. */
export async function cachedPack(code: Locale) {
  const pack = await readPack(code);
  return pack?.complete ? pack : null;
}

/** Returns the pack, generating it with AI the first time. */
export async function ensurePack(code: Locale): Promise<Pack> {
  const existing = await readPack(code);
  if (existing?.complete) return existing;
  if (building.has(code)) return building.get(code)!;

  const job = (async () => {
    const base = isBundled(code) ? dictionaries[code] : dictionaries.en;
    const dict = isBundled(code) ? base : rebuild(dictionaries.en as unknown as Tree, await translateMany(flatten(dictionaries.en as unknown as Tree), code)) as unknown as Dictionary;
    const sources = contentStrings().filter((t) => !existing?.phrases[t]);
    const translated = await translateMany(sources, code);
    const phrases = Object.fromEntries(sources.map((s, i) => [s, translated[i]]));
    // Keep anything already translated live, then add the full content set.
    const pack: Pack = { code, version: 1, complete: true, dict, phrases: { ...(existing?.phrases ?? {}), ...phrases } };
    await savePack(pack);
    return pack;
  })().finally(() => building.delete(code));

  building.set(code, job);
  return job;
}

/** Translates arbitrary page text, reusing and growing the pack's phrase book. */
export async function translatePhrases(code: Locale, texts: string[]) {
  const pack = (await readPack(code)) ?? { code, version: 1, complete: false, dict: dictionaries.en, phrases: {} };
  const missing = [...new Set(texts.filter((t) => !(t in pack.phrases)))];
  if (missing.length) {
    const translated = await translateMany(missing, code);
    if (Object.keys(pack.phrases).length < MAX_PHRASES) {
      missing.forEach((m, i) => (pack.phrases[m] = translated[i]));
      await savePack(pack);
    } else {
      return texts.map((t) => pack.phrases[t] ?? translated[missing.indexOf(t)] ?? t);
    }
  }
  return texts.map((t) => pack.phrases[t] ?? t);
}

/**
 * Re-translates strings a pack still has in English (left behind when free-tier
 * limits were hit), slowly, to stay under the per-minute quota.
 */
export async function repairPack(code: Locale) {
  const pack = await readPack(code);
  if (!pack?.complete || code === "en") return { fixed: 0, left: 0 };
  const flatEn = flatten(dictionaries.en as unknown as Tree);
  const flatNow = flatten(pack.dict as unknown as Tree);
  const dictIdx = isBundled(code) ? [] : flatNow.map((v, i) => (v === flatEn[i] && /[A-Za-z]{3}/.test(v) ? i : -1)).filter((i) => i >= 0);
  const phraseKeys = Object.keys(pack.phrases).filter((k) => pack.phrases[k] === k && /[A-Za-z]{3}/.test(k));
  const todo = [...dictIdx.map((i) => flatEn[i]), ...phraseKeys];
  let fixed = 0;
  for (let i = 0; i < todo.length; i += 20) {
    const part = todo.slice(i, i + 20);
    const out = await translateBatch(part, languageName(code), scriptOf(code));
    part.forEach((src, k) => {
      if (out[k] === src) return;
      fixed++;
      const di = dictIdx.find((d) => flatEn[d] === src);
      if (di !== undefined) flatNow[di] = out[k];
      if (src in pack.phrases) pack.phrases[src] = out[k];
    });
    await new Promise((r) => setTimeout(r, 6000));
  }
  if (!isBundled(code)) pack.dict = rebuild(dictionaries.en as unknown as Tree, flatNow) as unknown as Dictionary;
  await savePack(pack);
  return { fixed, left: todo.length - fixed };
}
