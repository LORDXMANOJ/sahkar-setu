import { hasAI, streamChat } from "@/lib/ai";
import { z } from "zod";
import { DEMO_TRAINEE_ID, getTrainee } from "@/lib/data";
import { readJson, sameOrigin } from "@/lib/guard";
import { locales } from "@/lib/i18n/dictionaries";
import { rateLimit } from "@/lib/rate-limit";
import { fallbackAnswer, systemPrompt } from "@/lib/sahayak";

const Body = z.object({
  locale: z.enum(locales),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) }))
    .min(1)
    .max(16)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", "Conversation must start and end with the trainee."),
});

function textStream(produce: (push: (s: string) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await produce((s) => controller.enqueue(encoder.encode(s)));
      } catch (err) {
        console.error("[sahayak]", err instanceof Error ? err.message : err);
        controller.enqueue(encoder.encode("\n\n[Sahayak couldn't finish this answer. Please ask again.]"));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const blocked = sameOrigin(request) ?? rateLimit(request, "assistant", 12, 60_000);
  if (blocked) return blocked;

  const body = await readJson(request, 24_000);
  if (body.error) return body.error;
  const parsed = Body.safeParse(body.data);
  if (!parsed.success) return Response.json({ error: "That message couldn't be read." }, { status: 400 });

  const { locale, messages } = parsed.data;
  // In production the trainee comes from the authenticated session.
  const trainee = getTrainee(DEMO_TRAINEE_ID)!;
  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Sahayak-Mode": hasAI() ? "ai" : "offline",
  };

  if (!hasAI()) {
    const answer = fallbackAnswer(trainee, messages[messages.length - 1].content, locale);
    return new Response(
      textStream(async (push) => {
        // Stream word by word so the offline mode feels the same as the live one.
        for (const part of answer.split(/(\s+)/)) {
          push(part);
          await new Promise((r) => setTimeout(r, 18));
        }
      }),
      { headers },
    );
  }

  return new Response(
    textStream(async (push) => {
      try {
        for await (const text of streamChat(systemPrompt(trainee, locale), messages, { signal: request.signal })) push(text);
      } catch (err) {
        // Every provider failed (quota, network): answer from the built-in guide instead.
        console.warn("[sahayak] falling back to offline guide:", err instanceof Error ? err.message : err);
        push(fallbackAnswer(trainee, messages[messages.length - 1].content, locale));
      }
    }),
    { headers },
  );
}
