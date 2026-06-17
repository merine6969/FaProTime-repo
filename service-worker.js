// Service Worker FaProTime
// Stratégie : "Network first, fallback cache" pour rester toujours à jour
// tout en offrant un minimum de support hors-ligne.

const CACHE_NAME = 'faprotime-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : met en cache les fichiers de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activation : nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : essaye le réseau d'abord, retombe sur le cache si hors-ligne
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes Firebase (auth/firestore) : toujours réseau direct
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Met à jour le cache avec la nouvelle version
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Hors-ligne : sert depuis le cache si disponible
        return caches.match(event.request);
      })
  );
});
