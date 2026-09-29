// Client-side outbox for quiz results. Answers are written here first, then
// sent to /api/progress whenever there is a connection. The server treats each
// event ID as idempotent, so resending after a flaky upload is safe.

export type QueuedResult = {
  id: string;
  lessonId: string;
  score: number;
  total: number;
  at: number;
};

const KEY = "ss.outbox.v1";

function read(): QueuedResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedResult[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedResult[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-200)));
  } catch {
    // Storage full or blocked: the result stays in memory for this visit only.
  }
}

export function enqueue(result: Omit<QueuedResult, "id" | "at">) {
  const item: QueuedResult = { ...result, id: crypto.randomUUID(), at: Date.now() };
  write([...read(), item]);
  return item;
}

export function pendingCount() {
  return read().length;
}

let flushing: Promise<void> | null = null;

export function flushQueue(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    const items = read();
    if (!items.length || !navigator.onLine) return;
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: items }),
      });
      if (res.ok) {
        const sent = new Set(items.map((i) => i.id));
        write(read().filter((i) => !sent.has(i.id)));
      }
    } catch {
      // Still offline or the server is unreachable; try again next time.
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

// Completed lessons, for the progress bar. Local only.
const DONE_KEY = "ss.done.v1";

export function completedLessons(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markLessonDone(lessonId: string, score: number) {
  try {
    const done = completedLessons();
    done[lessonId] = Math.max(done[lessonId] ?? 0, score);
    localStorage.setItem(DONE_KEY, JSON.stringify(done));
  } catch {
    // Non-critical.
  }
}
