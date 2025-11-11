const CACHE_NAME = 'kinmen-echo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './catalog.json',
  './app.js',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // 僅對同源資源做快取優先，外部 CDN 直接走網路
  const isSameOrigin = new URL(request.url).origin === self.location.origin;
  if (isSameOrigin) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
