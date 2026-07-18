// Service Worker using Google Workbox for offline asset strategies and IndexedDB sync queuing
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('⚡ Workbox loaded successfully in Service Worker.');
  
  // Force immediate activation
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  // Cache-first strategy for static assets (images, fonts, stylesheets, scripts)
  workbox.routing.registerRoute(
    ({ request }) => 
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'mcgi-ddo-assets-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Stale-While-Revalidate strategy for document navigation and HTML pages
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'mcgi-ddo-nav-cache',
    })
  );

  // Stale-while-revalidate for CDN assets (fonts, scripts, external css)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
                 url.origin === 'https://fonts.gstatic.com' ||
                 url.origin === 'https://unpkg.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'mcgi-ddo-external-cache',
    })
  );
} else {
  console.log('❌ Workbox failed to load in Service Worker.');
}

// --- IndexedDB Queue and Sync Manager ---
const DB_NAME = 'mcgi-ddo-offline-db';
const STORE_NAME = 'pending-submissions';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Listens for messages from the active clients (app tabs)
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'QUEUE_SUBMISSION') {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await new Promise((resolve, reject) => {
        const req = store.put(event.data.payload);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
      console.log('📥 Queued pending attendance record in IndexedDB:', event.data.payload.id);
      
      // Notify client that background queuing succeeded
      event.ports[0].postMessage({ status: 'queued', id: event.data.payload.id });
    } catch (err) {
      console.error('❌ Failed to queue pending attendance in IDB:', err);
      event.ports[0].postMessage({ status: 'error', error: err.message });
    }
  }
});
