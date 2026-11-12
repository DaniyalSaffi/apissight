/* ApisSight service worker: offline app shell for the static site.
 * Cache-first for same-origin GET requests, network fallback, old caches
 * removed on activate. Model files under /models/ are cached on first use,
 * so the detector works offline after its first load. Bump CACHE_NAME when
 * the shell changes. */
const CACHE_NAME = "apissight-v1";
const CORE_SHELL = [
  "./",
  "./detector/",
  "./project/",
  "./models-data/",
  "./learn/",
  "./credits/",
  "./manifest.webmanifest",
  "./favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
