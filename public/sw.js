/* Service Worker simple pour servir les tuiles mises en cache.
   ATTENTION: Ce service worker est un POC. Ne pas surcharger tile.openstreetmap.org en production.
*/

const CACHE_NAME = 'osm-tiles-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Intercepter les tuiles OpenStreetMap
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          // Clone and store
          if (resp && resp.ok) {
            cache.put(req, resp.clone()).catch(() => {});
          }
          return resp;
        } catch (err) {
          // si réseau impossible, renvoyer fallback (404)
          return new Response('Tile unavailable', { status: 503 });
        }
      })
    );
  }
  // pour le reste, laisser aller au réseau
});
