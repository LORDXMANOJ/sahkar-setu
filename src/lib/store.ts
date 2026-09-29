import "server-only";
import { jobs as seededJobs, type Job } from "./data";

// In-memory stand-in for the attendance and progress tables. It resets when the
// server restarts; production writes go to Postgres (supabase/schema.sql).

export type ProgressEvent = {
  id: string;
  traineeId: string;
  lessonId: string;
  score: number;
  total: number;
  at: number;
};

const g = globalThis as typeof globalThis & { __ssProgress?: Map<string, ProgressEvent> };
const progress = (g.__ssProgress ??= new Map());

/** Idempotent: offline clients may resend the same event after reconnecting. */
export function recordProgress(events: ProgressEvent[]) {
  let added = 0;
  for (const e of events) {
    if (!progress.has(e.id)) {
      progress.set(e.id, e);
      added++;
    }
  }
  return added;
}

export function progressFor(traineeId: string) {
  return [...progress.values()].filter((p) => p.traineeId === traineeId);
}

// ---------------------------------------------------------------------------
// Job applications and employer-posted jobs
// ---------------------------------------------------------------------------


export type Application = { jobId: string; traineeId: string; at: number };

const g2 = globalThis as typeof globalThis & { __ssApplications?: Application[]; __ssPostedJobs?: Job[] };
const applications = (g2.__ssApplications ??= []);
const postedJobs = (g2.__ssPostedJobs ??= []);

export function apply(jobId: string, traineeId: string) {
  if (!applications.some((a) => a.jobId === jobId && a.traineeId === traineeId)) {
    applications.push({ jobId, traineeId, at: Date.now() });
  }
}

export function applicationsFor(jobId: string) {
  return applications.filter((a) => a.jobId === jobId);
}

export function hasApplied(jobId: string, traineeId: string) {
  return applications.some((a) => a.jobId === jobId && a.traineeId === traineeId);
}

export function postJob(job: Omit<Job, "id" | "postedOn">) {
  const created: Job = {
    ...job,
    id: `J-${2000 + postedJobs.length + 1}`,
    postedOn: new Date().toISOString().slice(0, 10),
  };
  postedJobs.unshift(created);
  return created;
}

export function allJobs(): Job[] {
  return [...postedJobs, ...seededJobs];
}

// ---------------------------------------------------------------------------
// Exam integrity events
// ---------------------------------------------------------------------------

export type IntegrityEvent = {
  id: string;
  examId: string;
  traineeId: string;
  type: "started" | "left" | "returned" | "blur" | "fullscreen-exit" | "paste" | "copy" | "submitted";
  at: number;
  awayMs?: number;
};

const g3 = globalThis as typeof globalThis & { __ssIntegrity?: Map<string, IntegrityEvent> };
const integrity = (g3.__ssIntegrity ??= new Map<string, IntegrityEvent>());

export function recordIntegrity(events: IntegrityEvent[]) {
  for (const e of events) if (!integrity.has(e.id) && integrity.size < 50_000) integrity.set(e.id, e);
}

/** One summary row per trainee per exam, for the trainer. */
export function integritySummary() {
  const rows = new Map<string, { examId: string; traineeId: string; left: number; awayMs: number; pastes: number; fullscreenExits: number; submitted: boolean; lastAt: number }>();
  for (const e of integrity.values()) {
    const key = `${e.examId}:${e.traineeId}`;
    const r = rows.get(key) ?? { examId: e.examId, traineeId: e.traineeId, left: 0, awayMs: 0, pastes: 0, fullscreenExits: 0, submitted: false, lastAt: 0 };
    if (e.type === "left") r.left++;
    if (e.type === "returned") r.awayMs += e.awayMs ?? 0;
    if (e.type === "paste") r.pastes++;
    if (e.type === "fullscreen-exit") r.fullscreenExits++;
    if (e.type === "submitted") r.submitted = true;
    r.lastAt = Math.max(r.lastAt, e.at);
    rows.set(key, r);
  }
  return [...rows.values()].sort((a, b) => b.lastAt - a.lastAt);
}
