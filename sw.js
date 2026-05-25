const CACHE = 'nexus-v5';
const ASSETS = ['/NexusHub/', '/NexusHub/index.html', '/NexusHub/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always network first - never cache API calls
  if (e.request.url.includes('api.telegram') || 
      e.request.url.includes('fonts.google') ||
      e.request.url.includes('omg10.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
