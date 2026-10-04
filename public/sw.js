// Minimal app-shell service worker. No backend in Phase 1, so there is
// nothing to sync; the job is "always fresh online, still works offline".
//
// - Pages and route data (HTML, Next's .txt payloads): network-first, so a
//   new deploy shows up on the very next visit; the cache is only an
//   offline fallback.
// - Hashed build assets (/_next/static/): cache-first — their names change
//   whenever their content does, so a cached copy is never stale.
// - Everything else (icons, demo photos): stale-while-revalidate.
//
// Bump CACHE whenever this strategy changes so old caches are dropped.
const CACHE = "avaran-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isPageOrRouteData(request, url) {
  return request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".txt");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPageOrRouteData(request, url)) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request).then((cached) => cached || Response.error())),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
