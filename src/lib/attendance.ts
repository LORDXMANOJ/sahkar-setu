import "server-only";
import { randomInt } from "node:crypto";
import { networkInterfaces } from "node:os";
import { getTrainee } from "./data";
import { db, dbEnabled } from "./supabase/server";

// Class sessions with one attendance code each. The trainer starts a session,
// shows the code (typed, as a QR, or as a link), and ends it after class.
// Guards against sharing the code: same network as the trainer, one person per
// phone, and a one-tap "new code" for the trainer.

export type Mark = { traineeId: string; deviceId: string; ip: string; at: number };
export type ClassSession = {
  id: string;
  title: string;
  room: string;
  code: string;
  trainerId: string;
  trainerNetworks: string[];
  requireSameNetwork: boolean;
  startedAt: number;
  endedAt: number | null;
  marks: Mark[];
  flags: string[];
};

const MAX_AGE_MS = 3 * 60 * 60 * 1000;
// No 0/O, 1/I/L, 5/S: easy to read aloud and type on a basic phone.
const ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

const g = globalThis as typeof globalThis & { __ssSessions?: Map<string, ClassSession> };
const memory = (g.__ssSessions ??= new Map<string, ClassSession>());

const randomCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const formatCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;
export const normaliseCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
const isOpen = (s: ClassSession) => s.endedAt === null && Date.now() - s.startedAt < MAX_AGE_MS;

// ---------------------------------------------------------------------------
// Networks
// ---------------------------------------------------------------------------

function cleanIp(ip: string) {
  return ip.trim().replace(/^::ffff:/, "").replace(/^\[|\]$/g, "");
}
const isLoopback = (ip: string) => ip === "::1" || ip.startsWith("127.") || ip === "local";

/** /24 for IPv4, /64 for IPv6: everyone on the same Wi-Fi or hotspot shares it. */
export function networkOf(ip: string) {
  const c = cleanIp(ip);
  if (c.includes(".")) return c.split(".").slice(0, 3).join(".");
  return c.split(":").slice(0, 4).join(":");
}

/** The networks a trainer is on. On the server machine itself, that's its own LAN addresses. */
function trainerNetworks(ip: string) {
  const c = cleanIp(ip);
  if (!isLoopback(c)) return [networkOf(c)];
  const nets = Object.values(networkInterfaces())
    .flat()
    .filter((n): n is NonNullable<typeof n> => Boolean(n && !n.internal))
    .map((n) => networkOf(n.address));
  return [...new Set(["loopback", ...nets])];
}

function onTrainerNetwork(s: ClassSession, ip: string) {
  const c = cleanIp(ip);
  if (isLoopback(c)) return s.trainerNetworks.includes("loopback");
  return s.trainerNetworks.includes(networkOf(c));
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

type Row = {
  id: string;
  code: string;
  title: string;
  room: string;
  trainer_id: string;
  trainer_networks: string[];
  require_same_network: boolean;
  started_at: string;
  ended_at: string | null;
  flags: string[];
  attendance_marks?: { trainee_id: string; device_id: string; ip: string; marked_at: string }[];
};

const fromRow = (r: Row): ClassSession => ({
  id: r.id,
  code: r.code,
  title: r.title,
  room: r.room,
  trainerId: r.trainer_id,
  trainerNetworks: r.trainer_networks,
  requireSameNetwork: r.require_same_network,
  startedAt: Date.parse(r.started_at),
  endedAt: r.ended_at ? Date.parse(r.ended_at) : null,
  flags: r.flags ?? [],
  marks: (r.attendance_marks ?? [])
    .map((m) => ({ traineeId: m.trainee_id, deviceId: m.device_id, ip: m.ip, at: Date.parse(m.marked_at) }))
    .sort((a, b) => a.at - b.at),
});

const SELECT = "*, attendance_marks(trainee_id, device_id, ip, marked_at)";

async function load(where: { id?: string; code?: string }): Promise<ClassSession | undefined> {
  if (!dbEnabled) {
    if (where.id) return memory.get(where.id);
    return [...memory.values()].find((s) => s.code === where.code);
  }
  let q = db().from("class_sessions").select(SELECT);
  q = where.id ? q.eq("id", where.id) : q.eq("code", where.code!).is("ended_at", null);
  const { data, error } = await q.order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data ? fromRow(data as Row) : undefined;
}

async function update(id: string, patch: Partial<Pick<Row, "code" | "ended_at" | "flags">>) {
  if (!dbEnabled) return;
  const { error } = await db().from("class_sessions").update(patch).eq("id", id);
  if (error) throw new Error(`Database error: ${error.message}`);
}

async function freeCode() {
  for (;;) {
    const code = randomCode();
    if (!(await load({ code }))) return code;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function startSession(opts: { title: string; room: string; trainerIp: string; trainerId: string; requireSameNetwork: boolean }) {
  const s: ClassSession = {
    id: `s-${Date.now().toString(36)}-${randomInt(1e9).toString(36)}`,
    title: opts.title,
    room: opts.room,
    code: await freeCode(),
    trainerId: opts.trainerId,
    trainerNetworks: trainerNetworks(opts.trainerIp),
    requireSameNetwork: opts.requireSameNetwork,
    startedAt: Date.now(),
    endedAt: null,
    marks: [],
    flags: [],
  };
  if (dbEnabled) {
    const { error } = await db().from("class_sessions").insert({
      id: s.id,
      code: s.code,
      title: s.title,
      room: s.room,
      trainer_id: s.trainerId,
      trainer_networks: s.trainerNetworks,
      require_same_network: s.requireSameNetwork,
      started_at: new Date(s.startedAt).toISOString(),
    });
    if (error) throw new Error(`Database error: ${error.message}`);
  } else memory.set(s.id, s);
  return s;
}

export async function getSession(id: string) {
  return load({ id });
}

export async function sessionByCode(raw: string) {
  const code = normaliseCode(raw);
  if (code.length !== 6) return undefined;
  const s = await load({ code });
  return s && isOpen(s) ? s : undefined;
}

export async function endSession(id: string, trainerId: string) {
  const s = await load({ id });
  if (!s || s.trainerId !== trainerId || s.endedAt !== null) return;
  s.endedAt = Date.now();
  await update(id, { ended_at: new Date(s.endedAt).toISOString() });
}

export async function rotateCode(id: string, trainerId: string) {
  const s = await load({ id });
  if (!s || s.trainerId !== trainerId || !isOpen(s)) return;
  s.code = await freeCode();
  await update(id, { code: s.code });
}

export type CheckIn =
  | { ok: true; duplicate: boolean; session: ClassSession; at: number }
  | { ok: false; reason: "no-session" | "network" | "device-used" };

export async function checkIn(raw: string, traineeId: string, deviceId: string, ip: string): Promise<CheckIn> {
  const s = await sessionByCode(raw);
  if (!s) return { ok: false, reason: "no-session" };
  if (s.requireSameNetwork && !onTrainerNetwork(s, ip)) return { ok: false, reason: "network" };

  const mine = s.marks.find((m) => m.traineeId === traineeId);
  if (mine) return { ok: true, duplicate: true, session: s, at: mine.at };

  // One person per phone: marking a friend present from your own phone is refused.
  const sameDevice = s.marks.find((m) => m.deviceId === deviceId);
  if (sameDevice) {
    const name = (id: string) => getTrainee(id)?.name ?? id;
    s.flags.push(`A phone that marked ${name(sameDevice.traineeId)} also tried to mark ${name(traineeId)}`);
    await update(s.id, { flags: s.flags.slice(-20) });
    return { ok: false, reason: "device-used" };
  }

  const mark = { traineeId, deviceId, ip: networkOf(ip), at: Date.now() };
  if (dbEnabled) {
    const { error } = await db().from("attendance_marks").insert({
      session_id: s.id,
      trainee_id: traineeId,
      device_id: deviceId,
      ip: mark.ip,
      marked_at: new Date(mark.at).toISOString(),
    });
    // A unique violation means a parallel request from the same trainee or phone won the race.
    if (error) {
      if (error.code === "23505") return { ok: false, reason: "device-used" };
      throw new Error(`Database error: ${error.message}`);
    }
  } else s.marks.push(mark);
  return { ok: true, duplicate: false, session: s, at: mark.at };
}
