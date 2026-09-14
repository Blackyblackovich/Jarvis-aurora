const CACHE_NAME = 'jarvis-v7-r1';
const ASSETS = [
  './',
  './index.html',
  './gedeon.html',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // API запросы (OpenRouter, погода) — только сеть
  if (req.url.includes('openrouter.ai') || req.url.includes('open-meteo.com') || req.url.includes('bigdatacloud.net')) {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // Всё остальное — cache-first с fallback на сеть
  e.respondWith(
    caches.match(req).then(hit => {
      const fetchPromise = fetch(req).then(res => {
        if (res.ok && req.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
      return hit || fetchPromise;
    })
  );
});
