import "server-only";
import { jobs as seededJobs, type Job } from "./data";
import { db, dbEnabled } from "./supabase/server";

// Persistence. With Supabase configured (SUPABASE_SECRET_KEY set), everything
// is stored in Postgres (supabase/setup.sql); otherwise in memory, which resets
// on restart and is only meant for running the demo on one laptop.

const g = globalThis as typeof globalThis & {
  __ssProgress?: Map<string, ProgressEvent>;
  __ssApplications?: Application[];
  __ssPostedJobs?: Job[];
  __ssIntegrity?: Map<string, IntegrityEvent>;
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Lesson progress (offline quiz results)
// ---------------------------------------------------------------------------

export type ProgressEvent = { id: string; traineeId: string; lessonId: string; score: number; total: number; at: number };
const progress = (g.__ssProgress ??= new Map<string, ProgressEvent>());

/** Idempotent: offline clients may resend the same event after reconnecting. */
export async function recordProgress(events: ProgressEvent[]) {
  if (!events.length) return 0;
  if (dbEnabled) {
    const rows = events.map((e) => ({
      event_id: e.id,
      trainee_id: e.traineeId,
      lesson_id: e.lessonId,
      score: e.score,
      total: e.total,
      answered_at: new Date(e.at).toISOString(),
    }));
    const data = check(await db().from("lesson_progress").upsert(rows, { onConflict: "event_id", ignoreDuplicates: true }).select("event_id"));
    return data?.length ?? 0;
  }
  let added = 0;
  for (const e of events)
    if (!progress.has(e.id)) {
      progress.set(e.id, e);
      added++;
    }
  return added;
}

// ---------------------------------------------------------------------------
// Jobs and applications
// ---------------------------------------------------------------------------

export type Application = { jobId: string; traineeId: string; at: number };
const applications = (g.__ssApplications ??= []);
const postedJobs = (g.__ssPostedJobs ??= []);

export async function apply(jobId: string, traineeId: string) {
  if (dbEnabled) {
    check(await db().from("applications").upsert({ job_id: jobId, trainee_id: traineeId }, { onConflict: "job_id,trainee_id", ignoreDuplicates: true }));
    return;
  }
  if (!applications.some((a) => a.jobId === jobId && a.traineeId === traineeId)) applications.push({ jobId, traineeId, at: Date.now() });
}

export async function applicationsFor(jobId: string): Promise<Application[]> {
  if (dbEnabled) {
    const data = check(await db().from("applications").select("job_id, trainee_id, applied_at").eq("job_id", jobId));
    return (data ?? []).map((r) => ({ jobId: r.job_id, traineeId: r.trainee_id, at: Date.parse(r.applied_at) }));
  }
  return applications.filter((a) => a.jobId === jobId);
}

export async function appliedJobIds(traineeId: string): Promise<Set<string>> {
  if (dbEnabled) {
    const data = check(await db().from("applications").select("job_id").eq("trainee_id", traineeId));
    return new Set((data ?? []).map((r) => r.job_id as string));
  }
  return new Set(applications.filter((a) => a.traineeId === traineeId).map((a) => a.jobId));
}

export async function postJob(job: Omit<Job, "id" | "postedOn">, postedBy: string) {
  const postedOn = new Date().toISOString().slice(0, 10);
  if (dbEnabled) {
    const row = check(await db().from("posted_jobs").insert({ data: { ...job, postedOn }, posted_by: postedBy }).select("id").single());
    return { ...job, postedOn, id: `J-${row!.id}` } as Job;
  }
  const created: Job = { ...job, id: `J-${2000 + postedJobs.length + 1}`, postedOn };
  postedJobs.unshift(created);
  return created;
}

export async function allJobs(): Promise<Job[]> {
  if (dbEnabled) {
    const data = check(await db().from("posted_jobs").select("id, data").order("id", { ascending: false }).limit(200));
    return [...(data ?? []).map((r) => ({ ...(r.data as Omit<Job, "id">), id: `J-${r.id}` })), ...seededJobs];
  }
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
const integrity = (g.__ssIntegrity ??= new Map<string, IntegrityEvent>());

export async function recordIntegrity(events: IntegrityEvent[]) {
  if (!events.length) return;
  if (dbEnabled) {
    const rows = events.map((e) => ({
      id: e.id,
      exam_id: e.examId,
      trainee_id: e.traineeId,
      type: e.type,
      at: new Date(e.at).toISOString(),
      away_ms: e.awayMs ?? null,
    }));
    check(await db().from("integrity_events").upsert(rows, { onConflict: "id", ignoreDuplicates: true }));
    return;
  }
  for (const e of events) if (!integrity.has(e.id) && integrity.size < 50_000) integrity.set(e.id, e);
}

type Summary = { examId: string; traineeId: string; left: number; awayMs: number; pastes: number; fullscreenExits: number; submitted: boolean; lastAt: number };

/** One summary row per trainee per exam, for the trainer. */
export async function integritySummary(): Promise<Summary[]> {
  let events: IntegrityEvent[];
  if (dbEnabled) {
    const data = check(await db().from("integrity_events").select("id, exam_id, trainee_id, type, at, away_ms").order("at", { ascending: false }).limit(5000));
    events = (data ?? []).map((r) => ({ id: r.id, examId: r.exam_id, traineeId: r.trainee_id, type: r.type, at: Date.parse(r.at), awayMs: r.away_ms ?? undefined }));
  } else events = [...integrity.values()];

  const rows = new Map<string, Summary>();
  for (const e of events) {
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
