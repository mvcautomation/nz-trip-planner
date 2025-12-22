// Cache version - increment this to force re-download of all assets
const CACHE_VERSION = 'v2';
const CACHE_NAME = `nz-trip-${CACHE_VERSION}`;

// All pages and static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/planner',
  '/emergency',
  '/manifest.json',
  // Day pages (11 days: 12/30, 12/31, 1/1-1/9)
  '/day/12%2F30',
  '/day/12%2F31',
  '/day/1%2F1',
  '/day/1%2F2',
  '/day/1%2F3',
  '/day/1%2F4',
  '/day/1%2F5',
  '/day/1%2F6',
  '/day/1%2F7',
  '/day/1%2F8',
  '/day/1%2F9',
  // Images
  '/images/hobbiton-bkg.jpg',
  // Icons
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets for offline use');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('nz-trip-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();

        // Only cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
