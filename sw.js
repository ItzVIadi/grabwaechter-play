const CACHE = 'grab-shell-v3';
const BASE = self.registration.scope;     // pfadunabhängig (Wurzel oder Unterordner wie bei GitHub Pages)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE, BASE + 'icon.svg', BASE + 'icon-192.png', BASE + 'icon-512.png', BASE + 'manifest.webmanifest'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Netzwerk zuerst; erfolgreiche gleiche-Herkunft-GETs wandern in den Cache, offline kommt die Kopie.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}));
      }
      return res;
    } catch {
      return (await caches.match(e.request, { ignoreSearch: true })) || (await caches.match(BASE)) || Response.error();
    }
  })());
});
