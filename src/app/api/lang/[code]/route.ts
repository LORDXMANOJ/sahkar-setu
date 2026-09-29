import { hasAI } from "@/lib/ai";
import { dictionaries, isBundled, isLocale } from "@/lib/i18n/dictionaries";
import { cachedPack, ensurePack, repairPack } from "@/lib/i18n/packs";
import { timingSafeEqual } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";

// Downloads a language pack. The service worker keeps it for offline use.
export async function GET(request: Request, { params }: RouteContext<"/api/lang/[code]">) {
  const { code } = await params;
  if (!isLocale(code)) return Response.json({ error: "That language isn't available." }, { status: 404 });

  // Maintenance: ?repair=<ADMIN_TOKEN> fills in lines a pack still has in English.
  const repair = new URL(request.url).searchParams.get("repair");
  if (repair !== null) {
    const token = process.env.ADMIN_TOKEN ?? "";
    const ok = token.length >= 16 && repair.length === token.length && timingSafeEqual(Buffer.from(repair), Buffer.from(token));
    if (!ok) return Response.json({ error: "Not allowed." }, { status: 403 });
    return Response.json(await repairPack(code));
  }

  const limited = rateLimit(request, "lang", 20, 60_000);
  if (limited) return limited;

  const headers = { "Cache-Control": "public, max-age=3600" };
  const ready = await cachedPack(code);
  if (ready) return Response.json(ready, { headers });

  if (!hasAI()) {
    // Without an AI key, bundled languages still work from their hand-written dictionary.
    if (isBundled(code)) return Response.json({ code, version: 1, complete: true, dict: dictionaries[code], phrases: {} }, { headers });
    return Response.json(
      { error: "This language needs to be prepared once by the server. Add a GEMINI_API_KEY or GROQ_API_KEY and try again." },
      { status: 503 },
    );
  }

  try {
    return Response.json(await ensurePack(code), { headers });
  } catch (err) {
    console.error("[lang]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Couldn't prepare this language right now. Try again in a minute." }, { status: 502 });
  }
}
