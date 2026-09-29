import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { lessons } from "@/lib/data";
import { readJson, sameOrigin } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { recordProgress } from "@/lib/store";

const knownLessons = new Set(Object.values(lessons).flatMap((l) => l.map((x) => x.id)));

const Body = z.object({
  events: z
    .array(
      z
        .object({
          id: z.uuid(),
          lessonId: z.string().max(60),
          score: z.number().int().min(0).max(50),
          total: z.number().int().min(1).max(50),
          at: z.number().int().positive(),
        })
        .refine((e) => e.score <= e.total, "Score can't be higher than the number of questions."),
    )
    .max(200),
});

// Receives quiz results queued on the phone while offline.
export async function POST(request: Request) {
  const blocked = sameOrigin(request) ?? rateLimit(request, "progress", 20, 60_000);
  if (blocked) return blocked;

  const body = await readJson(request, 64_000);
  if (body.error) return body.error;

  const parsed = Body.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: "Some results were malformed." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user?.traineeId) return Response.json({ error: "Sign in as a trainee." }, { status: 403 });
  const traineeId = user.traineeId;
  const now = Date.now();
  const events = parsed.data.events
    .filter((e) => knownLessons.has(e.lessonId) && e.at <= now + 60_000)
    .map((e) => ({ ...e, traineeId }));

  const added = await recordProgress(events);
  return Response.json({ received: events.length, added });
}
