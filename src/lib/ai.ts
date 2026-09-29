import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import Groq from "groq-sdk";

// One interface over two free providers: Gemini first, then Groq. Each fails over
// to the next when it errors or runs out of free quota before producing any output.

export type ChatMessage = { role: "user" | "assistant"; content: string };
type Provider = { name: string; stream: (system: string, messages: ChatMessage[], signal?: AbortSignal) => AsyncGenerator<string> };

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

function providers(): Provider[] {
  const list: Provider[] = [];

  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    list.push({
      name: "gemini",
      async *stream(system, messages, signal) {
        const res = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          config: { systemInstruction: system, abortSignal: signal, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
        });
        for await (const chunk of res) if (chunk.text) yield chunk.text;
      },
    });
  }

  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    list.push({
      name: "groq",
      async *stream(system, messages, signal) {
        const res = await groq.chat.completions.create(
          { model: GROQ_MODEL, stream: true, max_tokens: 1024, messages: [{ role: "system", content: system }, ...messages] },
          { signal },
        );
        for await (const chunk of res) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) yield text;
        }
      },
    });
  }

  return list;
}

export function hasAI() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
}

// A provider that says "quota exceeded" is skipped for a minute instead of retried on every call.
const coolUntil = new Map<string, number>();
function isRateLimit(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(msg);
}

/** Streams text from the first provider that works. Returns which one answered via onProvider. */
export async function* streamChat(
  system: string,
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onProvider?: (name: string) => void } = {},
): AsyncGenerator<string> {
  let lastError: unknown;
  for (const p of providers()) {
    if ((coolUntil.get(p.name) ?? 0) > Date.now()) continue;
    let started = false;
    // A busy provider gets 15 seconds to start answering before we move on.
    const slow = new AbortController();
    const timer = setTimeout(() => slow.abort(new Error(`${p.name} took too long to respond`)), 15_000);
    const signal = opts.signal ? AbortSignal.any([opts.signal, slow.signal]) : slow.signal;
    try {
      for await (const text of p.stream(system, messages, signal)) {
        if (!started) {
          started = true;
          clearTimeout(timer);
          opts.onProvider?.(p.name);
        }
        yield text;
      }
      if (started) return;
    } catch (err) {
      if (started || opts.signal?.aborted) throw err; // Mid-answer failure or user cancelled: don't retry.
      lastError = err;
      if (isRateLimit(err)) coolUntil.set(p.name, Date.now() + 60_000);
      console.warn(`[ai] ${p.name} failed, trying next:`, err instanceof Error ? err.message.slice(0, 200) : err);
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastError) throw lastError;
  throw new Error(hasAI() ? "All AI providers are rate-limited right now. Try again in a minute." : "No AI provider is configured.");
}

async function complete(system: string, prompt: string) {
  let out = "";
  for await (const t of streamChat(system, [{ role: "user", content: prompt }])) out += t;
  return out;
}

const INDIC = /[ऀ-෿]/gu;
/** True when every Indian-script letter in the text belongs to the target script. */
function inScript(text: string, script: RegExp) {
  if (!script.test(text)) return false;
  return (text.match(INDIC) ?? []).every((ch) => script.test(ch));
}

function parseArray(raw: string, expected: number) {
  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed) || parsed.length !== expected) throw new Error("Translation came back malformed.");
  return parsed;
}

/**
 * Translates a batch of short UI strings, in order. If the model returns broken
 * JSON it retries once, then splits the batch; a string that still fails comes
 * back untranslated rather than breaking the page.
 */
export async function translateBatch(texts: string[], languageName: string, script?: RegExp, attempt = 0): Promise<string[]> {
  if (!texts.length) return [];
  const system = `You translate user-interface text for an Indian cooperative training platform into ${languageName}. Use simple, everyday words a rural trainee would understand, in ${languageName} script. Keep numbers, currency (₹), IDs like NCCT-2026-GNR-0412, codes, URLs and brand names (Sahkar Setu, NCCT, PACS, SHG, UPI, QR) unchanged. Reply with only a valid JSON array of strings (escape any double quotes inside strings), same length and order as the input.`;
  try {
    const parsed = parseArray(await complete(system, JSON.stringify(texts)), texts.length);
    const out = parsed.map((v, i) => (typeof v === "string" && v.trim() ? v.trim() : texts[i]));
    // Guard against the model answering in the wrong language or mixing scripts:
    // any string with letters from a different Indian script is translated again.
    if (script) {
      const bad = out.map((v, i) => (v !== texts[i] && !inScript(v, script) ? i : -1)).filter((i) => i >= 0);
      if (bad.length) {
        if (attempt >= 2) bad.forEach((i) => (out[i] = texts[i])); // English is better than the wrong language
        else {
          const redo = await translateBatch(bad.map((i) => texts[i]), languageName, script, attempt + 1);
          bad.forEach((i, k) => (out[i] = redo[k]));
        }
      }
    }
    return out;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("No AI provider")) throw err;
    if (attempt === 0 && !isRateLimit(err)) return translateBatch(texts, languageName, script, 1);
    if (attempt >= 2 && !isRateLimit(err)) return texts;
    if (texts.length === 1) {
      if (isRateLimit(err)) throw err;
      return texts;
    }
    const mid = Math.ceil(texts.length / 2);
    return [
      ...(await translateBatch(texts.slice(0, mid), languageName, script, 1)),
      ...(await translateBatch(texts.slice(mid), languageName, script, 1)),
    ];
  }
}
