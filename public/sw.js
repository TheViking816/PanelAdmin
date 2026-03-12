const CACHE_VERSION = 'v7';
const STATIC_CACHE = `paneladmin-static-${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json?v=7',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key.startsWith('paneladmin-static-') && key !== STATIC_CACHE) {
          return caches.delete(key);
        }
        return undefined;
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (!isSameOrigin) return;

  if (isDocument) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(STATIC_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await caches.match('./index.html');
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      fetch(event.request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(event.request, response.clone());
          }
        })
        .catch(() => undefined);
      return cached;
    }

    const response = await fetch(event.request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  })());
});
