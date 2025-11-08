const CACHE_NAME = 'iot-cache-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './bg_nature_dark.png',
  './dashboard_anim.json'
];

// INSTALL — simpan file ke cache
self.addEventListener('install', e => {
  console.log('[ServiceWorker] Installing new version...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // langsung aktif tanpa nunggu sesi lama
});

// ACTIVATE — hapus cache versi lama
self.addEventListener('activate', e => {
  console.log('[ServiceWorker] Activating new version...');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', k);
            return caches.delete(k);
          }
        })
      )
    )
  );
  self.clients.claim(); // langsung kontrol semua tab aktif
});

// FETCH — ambil dari cache dulu, lalu update dari network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      const fetchPromise = fetch(e.request)
        .then(networkResponse => {
          // update cache dengan versi terbaru dari server
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(e.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => response); // kalau offline, pake cache aja

      return response || fetchPromise;
    })
  );
});
