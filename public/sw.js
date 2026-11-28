// Service worker mínimo: permite instalar a app e abrir o "esqueleto" sem rede.
// Os dados (Supabase) nunca passam por cache: são sempre pedidos à rede.
const CACHE = "homi-v3";
const SCOPE = new URL(self.registration.scope).pathname; // ex.: /Homi/

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([SCOPE])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  // páginas: rede primeiro, cache se estiver offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(SCOPE))),
    );
    return;
  }

  // ficheiros com hash (_next/static) e ícones: cache primeiro
  if (url.pathname.includes("/_next/static/") || url.pathname.includes("/icons/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
