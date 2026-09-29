// Sahkar Setu service worker: keeps the trainee app usable without a signal.
// Pages: network first, falling back to the last copy saved on the phone.
// Build assets: cache first (their file names change on every deploy).

const VERSION = "v2";
const PAGES = `ss-pages-${VERSION}`;
const ASSETS = `ss-assets-${VERSION}`;
const PRECACHE = ["/app", "/app/learn", "/app/learn/fat-snf", "/app/learn/adulteration", "/app/learn/cold-chain", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { credentials: "same-origin" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Language packs: network first, keep a copy so the language works offline.
  if (url.pathname.startsWith("/api/lang/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return (await cache.match(request)) || Response.error();
        }
      }),
    );
    return;
  }
  if (url.pathname.startsWith("/api/")) return; // Live data only; the app queues writes itself.

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        try {
          // Slow rural networks: give up after 4 seconds and use the saved copy.
          const res = await Promise.race([fetch(request), timeout(4000)]);
          if (res.ok && url.pathname.startsWith("/app")) cache.put(request, res.clone());
          return res;
        } catch {
          return (
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match("/offline")) ||
            new Response("You're offline.", { status: 503, headers: { "Content-Type": "text/plain" } })
          );
        }
      })(),
    );
  }
});
