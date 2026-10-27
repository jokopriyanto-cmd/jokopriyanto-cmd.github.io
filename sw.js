/* Service worker VTAG Otoklix. Ganti VERSION setiap rilis → aplikasi di HP otomatis update. */
const VERSION = '2.0.0';
const CACHE = 'vtag-' + VERSION;
const ASSETS = ['./', 'index.html', 'app.js', 'styles.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'icons/favicon-32.png', 'icons/logo-otoklix.png', 'icons/logo-otoacademy.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // data Google tidak di-cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) c.put(req, res.clone());
    return res;
  }))));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const caseId = e.notification.data && e.notification.data.caseId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if ('focus' in c) { c.postMessage({ type: 'open-case', caseId }); return c.focus(); }
    }
    return self.clients.openWindow('./');
  }));
});
