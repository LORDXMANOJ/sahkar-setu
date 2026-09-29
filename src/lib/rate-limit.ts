import "server-only";

// Fixed-window limiter keyed by client IP. Good enough for a single instance;
// behind a load balancer, swap the Map for Redis or Upstash with the same shape.
const g = globalThis as typeof globalThis & { __ssBuckets?: Map<string, { count: number; reset: number }> };
const buckets = (g.__ssBuckets ??= new Map());

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "local").trim().slice(0, 64);
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
    }
    return null;
  }

  bucket.count++;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.ceil((bucket.reset - now) / 1000);
  return Response.json(
    { error: `Too many requests. Try again in ${retryAfter} seconds.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/** Same limiter for server actions, which have no Request object. True when over the limit. */
export function overLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > limit;
}
