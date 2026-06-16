// Aurora — Service Worker (manual). Fase 1.
// Estratégias:
//  - navegações: network-first com fallback para /offline.html
//  - estáticos (_next/static, scripts, styles, fonts, imagens): stale-while-revalidate
//  - só GET, só mesma origem
const CACHE_VERSION = "aurora-v1";
const PRECACHE_URLS = ["/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegações: tenta a rede; se cair, mostra a página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        const offline = await cache.match("/offline.html");
        return offline || Response.error();
      }),
    );
    return;
  }

  // Estáticos: stale-while-revalidate.
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    ["style", "script", "font", "image"].includes(request.destination);

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
