import { z } from "zod";
import { hasAI } from "@/lib/ai";
import { readJson, sameOrigin } from "@/lib/guard";
import { locales } from "@/lib/i18n/dictionaries";
import { translatePhrases } from "@/lib/i18n/packs";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  lang: z.enum(locales).exclude(["en"]),
  texts: z.array(z.string().trim().min(1).max(500)).min(1).max(80),
});

// Live translation for any page text that isn't in the language pack yet.
export async function POST(request: Request) {
  const blocked = sameOrigin(request) ?? rateLimit(request, "translate", 40, 60_000);
  if (blocked) return blocked;

  const body = await readJson(request, 48_000);
  if (body.error) return body.error;
  const parsed = Body.safeParse(body.data);
  if (!parsed.success) return Response.json({ error: "Nothing to translate." }, { status: 400 });

  const { lang, texts } = parsed.data;
  if (!hasAI()) return Response.json({ translations: texts, live: false });

  try {
    return Response.json({ translations: await translatePhrases(lang, texts), live: true });
  } catch (err) {
    console.error("[translate]", err instanceof Error ? err.message : err);
    return Response.json({ translations: texts, live: false });
  }
}
