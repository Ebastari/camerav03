const CACHE_NAME = 'monitoring-v8-eco-cache';
// Daftar file & CDN yang akan di-cache
const FILES_TO_CACHE = [
  'index.html',
  'manifest.json',
  // 'icon-192.png', // Ganti dengan path ikon Anda
  // 'icon-512.png',
  
  // CDN Libraries
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/dist/piexif.min.js',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.1/dist/dexie.min.js',
  
  // Aset Leaflet (penting agar peta tidak rusak saat offline)
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Event: Install
self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Event: Activate
// (Hapus cache lama jika ada versi baru)
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Event: Fetch (Strategi Cache-First)
self.addEventListener('fetch', (evt) => {
  // Jangan cache request ke Apps Script
  if (evt.request.url.includes('script.google.com')) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // Strategi Cache-First
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      // Jika ada di cache, kembalikan dari cache
      if (response) {
        return response;
      }
      // Jika tidak, fetch dari network, kembalikan, dan simpan ke cache
      return fetch(evt.request).then((networkResponse) => {
        // Cek jika response valid
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(evt.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Gagal fetch (offline) dan tidak ada di cache
    })
  );
});