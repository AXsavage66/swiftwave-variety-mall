const SHELL_CACHE = 'swiftwave-shell-v1';
const DATA_CACHE = 'swiftwave-data-v1';

// Static assets cached on first installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Install: Cache core HTML, logo, and manifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Purge old cache buckets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy routing
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Google Sheets Inventory CSV: Network-First (Fallback to Cache when offline)
  if (url.hostname === 'docs.google.com' && url.pathname.includes('/gviz/tq')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('', { status: 503, statusText: 'Offline and no cached data' });
        })
    );
    return;
  }

  // 2. Product Images (Google Drive thumbnails, Unsplash): Cache-First
  if (
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('unsplash.com') ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const live = await fetch(event.request);
          if (live && live.status === 200) {
            cache.put(event.request, live.clone());
          }
          return live;
        } catch {
          return new Response('', { status: 408, statusText: 'Image unavailable offline' });
        }
      })
    );
    return;
  }

  // 3. Vite App Bundles & Navigation: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((live) => {
        if (live && live.status === 200 && event.request.method === 'GET') {
          const clone = live.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return live;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cached || networkFetch;
    })
  );
});
