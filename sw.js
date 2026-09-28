// Clue Companion - Service Worker for Offline Play
const CACHE_NAME = 'clue-app-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/vue@3/dist/vue.global.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((resp) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.url.startsWith('http')) {
            cache.put(e.request, resp.clone());
          }
          return resp;
        });
      }).catch(() => cached);
    })
  );
});
