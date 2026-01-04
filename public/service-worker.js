const CACHE_NAME = 'kontiq-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/global-harmonized.css',
  '/js/app.js',
  '/js/modal-manager.js',
  '/js/close-button-fixer.js',
  '/js/form-harmonizer.js',
  '/js/clickability-fixer.js',
  '/js/performance-optimizer.js'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Si quelques ressources échouent, continuer quand même
        console.log('Some resources could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner la réponse
        const responseToCache = response.clone();
        
        // Ne mettre en cache que les réponses réussies
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si la requête échoue, utiliser le cache
        return caches.match(event.request)
          .then((response) => {
            return response || new Response('Offline - Resource not available');
          });
      })
  );
});
