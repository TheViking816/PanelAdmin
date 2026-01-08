self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('paneladmin-static-v5').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json?v=5',
        './assets/logo.png',
        './icons/icon-192.png',
        './icons/icon-512.png',
        './icons/icon-512-maskable.png',
        './icons/apple-touch-icon.png'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== 'paneladmin-static-v5') {
            return caches.delete(key);
          }
          return undefined;
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        if (response.status === 200 && response.type === 'basic') {
          caches.open('paneladmin-static-v2').then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
