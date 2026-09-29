import "server-only";
import { randomInt } from "node:crypto";
import { networkInterfaces } from "node:os";
import { getTrainee } from "./data";

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
const sessions = (g.__ssSessions ??= new Map<string, ClassSession>());

function newCode() {
  let code: string;
  do code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  while ([...sessions.values()].some((s) => s.code === code));
  return code;
}

export const formatCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;
export const normaliseCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

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
// Sessions
// ---------------------------------------------------------------------------

export function startSession(opts: { title: string; room: string; trainerIp: string; requireSameNetwork: boolean }) {
  const s: ClassSession = {
    id: `s-${Date.now().toString(36)}-${randomInt(1e6).toString(36)}`,
    title: opts.title,
    room: opts.room,
    code: newCode(),
    trainerNetworks: trainerNetworks(opts.trainerIp),
    requireSameNetwork: opts.requireSameNetwork,
    startedAt: Date.now(),
    endedAt: null,
    marks: [],
    flags: [],
  };
  sessions.set(s.id, s);
  return s;
}

export function getSession(id: string) {
  return sessions.get(id);
}

function isOpen(s: ClassSession) {
  return s.endedAt === null && Date.now() - s.startedAt < MAX_AGE_MS;
}

export function sessionByCode(raw: string) {
  const code = normaliseCode(raw);
  if (code.length !== 6) return undefined;
  const s = [...sessions.values()].find((x) => x.code === code);
  return s && isOpen(s) ? s : undefined;
}

export function endSession(id: string) {
  const s = sessions.get(id);
  if (s && s.endedAt === null) s.endedAt = Date.now();
  return s;
}

export function rotateCode(id: string) {
  const s = sessions.get(id);
  if (s && isOpen(s)) s.code = newCode();
  return s;
}

export type CheckIn =
  | { ok: true; duplicate: boolean; session: ClassSession; at: number }
  | { ok: false; reason: "no-session" | "network" | "device-used" };

export function checkIn(raw: string, traineeId: string, deviceId: string, ip: string): CheckIn {
  const s = sessionByCode(raw);
  if (!s) return { ok: false, reason: "no-session" };
  if (s.requireSameNetwork && !onTrainerNetwork(s, ip)) return { ok: false, reason: "network" };

  const mine = s.marks.find((m) => m.traineeId === traineeId);
  if (mine) return { ok: true, duplicate: true, session: s, at: mine.at };

  // One person per phone: marking a friend present from your own phone is refused.
  const sameDevice = s.marks.find((m) => m.deviceId === deviceId);
  if (sameDevice) {
    const name = (id: string) => getTrainee(id)?.name ?? id;
    s.flags.push(`A phone that marked ${name(sameDevice.traineeId)} also tried to mark ${name(traineeId)}`);
    return { ok: false, reason: "device-used" };
  }

  const mark = { traineeId, deviceId, ip: networkOf(ip), at: Date.now() };
  s.marks.push(mark);
  return { ok: true, duplicate: false, session: s, at: mark.at };
}
