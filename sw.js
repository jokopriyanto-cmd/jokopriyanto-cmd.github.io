/* Service worker VTAG Otoklix. Ganti VERSION setiap rilis → aplikasi di HP otomatis update. */
const VERSION = '2.3.0';
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

/* ---------- push notification: bunyi walau aplikasi ditutup ---------- */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('vtag', 2);
    r.onupgradeneeded = () => {
      const d = r.result;
      ['drafts', 'blobs', 'meta'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function metaGet(id) {
  return idb().then(d => new Promise(res => {
    const q = d.transaction('meta', 'readonly').objectStore('meta').get(id);
    q.onsuccess = () => { res(q.result || null); d.close(); };
    q.onerror = () => { res(null); d.close(); };
  })).catch(() => null);
}
function metaPut(obj) {
  return idb().then(d => new Promise(res => {
    const t = d.transaction('meta', 'readwrite'); t.objectStore('meta').put(obj);
    t.oncomplete = () => { res(); d.close(); }; t.onerror = () => { res(); d.close(); };
  })).catch(() => {});
}
const NOTIF_OPT = { icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [250, 120, 250, 120, 400], renotify: true, requireInteraction: false };

async function handlePush() {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const visible = wins.filter(c => c.visibilityState === 'visible');
  if (visible.length) { visible.forEach(c => c.postMessage({ type: 'sync' })); return; } // aplikasi sedang dibuka: cukup notif di dalam aplikasi
  const auth = await metaGet('auth');
  let events = [];
  if (auth && auth.token && auth.api) {
    try {
      const r = await fetch(auth.api, { method: 'POST', redirect: 'follow', cache: 'no-store', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'notifs', token: auth.token, args: [] }) });
      const j = await r.json();
      if (j.ok && j.data) events = j.data.events || [];
    } catch (e) { /* tampilkan notif umum */ }
  }
  const seen = (await metaGet('pushSeen')) || { id: 'pushSeen', ts: '' };
  let fresh = events.filter(e => e.ts > (seen.ts || ''));
  if (events.length) await metaPut({ id: 'pushSeen', ts: events[0].ts });
  if (!fresh.length) {
    if (events.length) fresh = [events[0]];
    else return self.registration.showNotification('VTAG Otoklix', Object.assign({ body: 'Ada pembaruan data kasus. Ketuk untuk membuka.', tag: 'vt-general' }, NOTIF_OPT));
  }
  const list = fresh.slice(0, 4);
  if (fresh.length > 4) list[3] = { caseId: '', type: 'more', message: (fresh.length - 3) + ' notifikasi lainnya. Ketuk untuk membuka aplikasi.', ts: fresh[3].ts };
  await Promise.all(list.map(e => self.registration.showNotification('VTAG Otoklix', Object.assign({
    body: e.message, tag: 'vt-' + e.caseId + '-' + e.type, data: { caseId: e.caseId }, timestamp: Date.now()
  }, NOTIF_OPT))));
}

self.addEventListener('push', e => { e.waitUntil(handlePush()); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const caseId = e.notification.data && e.notification.data.caseId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if ('focus' in c) { c.postMessage({ type: 'open-case', caseId }); return c.focus(); }
    }
    return self.clients.openWindow(caseId ? './?case=' + encodeURIComponent(caseId) : './');
  }));
});
