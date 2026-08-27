self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open("sage-v1").then((cache) =>
      cache.match(e.request).then((res) => res || fetch(e.request).then((r) => { cache.put(e.request, r.clone()); return r; }))
    )
  );
});
