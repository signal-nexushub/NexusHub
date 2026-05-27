const CACHE = 'nexus-v3';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Install - cache assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch - cache first
self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('api.telegram.org') ||
    e.request.url.includes('fonts.googleapis') ||
    e.request.url.includes('firestore') ||
    e.request.url.includes('firebase')
  ) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push notification - Firebase/server se aane par
self.addEventListener('push', e => {
  let data = { title: '🎯 Nexus Prediction', body: 'Naya signal aaya!', icon: 'icon-192.png' };
  try { data = e.data.json(); } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'nexus-signal',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: self.location.origin }
    })
  );
});

// Notification click - app open karo
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(self.location.origin);
    })
  );
});

// Message from app - show notification when app is background
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title || '🎯 Nexus Prediction', {
      body: e.data.body || 'Naya signal aaya!',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'nexus-signal',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: self.location.origin }
    });
  }
});
