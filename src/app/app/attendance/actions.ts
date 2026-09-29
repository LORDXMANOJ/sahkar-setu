"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import * as att from "@/lib/attendance";
import { can, getCurrentUser } from "@/lib/auth";
import { getTrainee } from "@/lib/data";
import { overLimit } from "@/lib/rate-limit";

const DEVICE_COOKIE = "ss_device";

async function requestIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** A random per-phone ID, so one phone can't mark several people present. */
async function deviceId() {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{22}$/.test(existing)) return existing;
  const id = randomBytes(16).toString("base64url");
  jar.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: (await headers()).get("x-forwarded-proto") === "https",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

const Start = z.object({
  title: z.string().trim().min(3).max(80),
  room: z.string().trim().min(1).max(40),
  requireSameNetwork: z.boolean(),
});

async function trainer() {
  const user = await getCurrentUser();
  return user && can.runSessions(user) ? user : null;
}

export async function startSessionAction(input: z.input<typeof Start>) {
  const user = await trainer();
  if (!user) return { ok: false as const, message: "Only trainers can start a session." };
  const parsed = Start.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Give the session a title and room." };
  const s = await att.startSession({ ...parsed.data, trainerId: user.id, trainerIp: await requestIp() });
  return { ok: true as const, id: s.id };
}

export async function endSessionAction(id: string) {
  const user = await trainer();
  if (user) await att.endSession(String(id), user.id);
}

export async function rotateCodeAction(id: string) {
  const user = await trainer();
  if (user) await att.rotateCode(String(id), user.id);
}

export type CheckInResult =
  | { ok: true; duplicate: boolean; at: number; title: string; room: string; name: string }
  | { ok: false; message: string };

const messages = {
  "no-session": "That code isn't open. Check the code on the trainer's screen, or ask if the session has ended.",
  network: "Connect to the classroom Wi-Fi or hotspot to mark attendance. You can't mark it from another network.",
  "device-used": "This phone has already marked someone present in this session. Each trainee marks from their own phone.",
};

/** demoTraineeId is only used in demo mode; signed-in trainees always mark themselves. */
export async function checkIn(rawCode: string, demoTraineeId?: string): Promise<CheckInResult> {
  if (typeof rawCode !== "string") return { ok: false, message: messages["no-session"] };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to mark attendance." };
  const traineeId = user.role === "demo" ? String(demoTraineeId ?? "") : user.traineeId;
  const trainee = traineeId ? getTrainee(traineeId) : undefined;
  if (!trainee) return { ok: false, message: user.role === "demo" ? "Choose your name first." : "Only trainees can mark attendance." };

  // Ten tries a minute per network address: enough for typos, useless for guessing codes.
  if (overLimit(`checkin:${await requestIp()}`, 10, 60_000)) {
    return { ok: false, message: "Too many tries. Wait a minute, then enter the code again." };
  }

  // Accept the bare code or the link a phone camera opens (…/a/K7P4QX).
  let code = rawCode.trim().slice(0, 200);
  try {
    code = new URL(code).pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    // not a URL
  }

  const r = await att.checkIn(code, trainee.id, await deviceId(), await requestIp());
  if (!r.ok) return { ok: false, message: messages[r.reason] };
  return { ok: true, duplicate: r.duplicate, at: r.at, title: r.session.title, room: r.session.room, name: trainee.name };
}
