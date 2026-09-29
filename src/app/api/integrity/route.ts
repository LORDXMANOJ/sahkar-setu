import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getTrainee } from "@/lib/data";
import { readJson, sameOrigin } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { recordIntegrity } from "@/lib/store";

const Body = z.object({
  examId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  traineeId: z.string().max(20),
  events: z
    .array(
      z.object({
        id: z.uuid(),
        type: z.enum(["started", "left", "returned", "blur", "fullscreen-exit", "paste", "copy", "submitted"]),
        at: z.number().int().positive(),
        awayMs: z.number().int().min(0).max(24 * 3600 * 1000).optional(),
      }),
    )
    .min(1)
    .max(200),
});

// Exam integrity log: when a trainee leaves the exam screen, pastes, and so on.
export async function POST(request: Request) {
  const blocked = sameOrigin(request) ?? rateLimit(request, "integrity", 60, 60_000);
  if (blocked) return blocked;
  const body = await readJson(request, 32_000);
  if (body.error) return body.error;
  const parsed = Body.safeParse(body.data);
  if (!parsed.success) return Response.json({ error: "Malformed events." }, { status: 400 });

  // Signed-in trainees are always logged as themselves; the name picker exists only in demo mode.
  const user = await getCurrentUser();
  const traineeId = user?.role === "demo" ? getTrainee(parsed.data.traineeId)?.id : user?.traineeId;
  if (!traineeId) return Response.json({ error: "Sign in as a trainee." }, { status: 403 });
  const now = Date.now();
  await recordIntegrity(
    parsed.data.events
      .filter((e) => e.at <= now + 60_000)
      .map((e) => ({ ...e, examId: parsed.data.examId, traineeId })),
  );
  return Response.json({ ok: true });
}
