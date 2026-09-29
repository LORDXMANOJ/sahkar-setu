import "server-only";

/**
 * Rejects state-changing requests sent from another site. Browsers always send
 * Origin on cross-site POSTs, so a mismatch means someone else's page is
 * trying to act on behalf of our user.
 */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null; // Same-origin fetches from older browsers, server-to-server calls.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    // fall through
  }
  return Response.json({ error: "Requests from other sites are not allowed." }, { status: 403 });
}

/** Reads a JSON body with a hard size cap, without trusting Content-Length. */
export async function readJson(request: Request, maxBytes: number) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { error: Response.json({ error: "Send JSON." }, { status: 415 }) } as const;
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    return { error: Response.json({ error: "Request is too large." }, { status: 413 }) } as const;
  }
  try {
    return { data: JSON.parse(text) as unknown } as const;
  } catch {
    return { error: Response.json({ error: "Request wasn't valid JSON." }, { status: 400 }) } as const;
  }
}
