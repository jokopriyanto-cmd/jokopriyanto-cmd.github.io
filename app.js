/* Otoklix Workshop Investigation (VTAG) – aplikasi v2
 * Tampilan berjalan di GitHub Pages, data lewat API Google Apps Script.
 */
'use strict';

var CONFIG = {
  VERSION: '2.3.0',
  API_URL: 'https://script.google.com/macros/s/AKfycbyGcLEZZ2Xm0nYl2gq53Qng-KmOUYSqvCrlwtAfRrxROwIREyGL3JyG9CQPlT_9QBYq1Q/exec',
  POLL_MS: 20000,            // cek data baru tiap 20 detik
  CHUNK: 2359296,            // 9 x 256 KB per potongan upload
  PARALLEL: 2,               // jumlah file diupload bersamaan
  IMG_MAX: 2560,             // sisi terpanjang foto setelah kompres (px)
  IMG_Q: 0.86,               // kualitas JPEG
  IMG_MIN_BYTES: 700 * 1024, // foto di bawah ini tidak dikompres
  VID_MIN_BYTES: 15 * 1024 * 1024,
  VID_MAX_SECONDS: 600
};
if (window.__TEST_CONFIG) Object.keys(window.__TEST_CONFIG).forEach(function (k) { CONFIG[k] = window.__TEST_CONFIG[k]; });

/* ================= ikon ================= */
var IC = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  car: '<path d="M5 17H3v-4l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v4h-2"/><path d="M3 13h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  warn: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  wifioff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  upload: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
};
function ic(n, c) { return '<svg class="i ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
function kindIcon(k) { return k === 'image' ? 'camera' : k === 'video' ? 'video' : 'file'; }

/* ================= util ================= */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
  } catch (e) { /* abaikan */ }
  return null;
}
function sstore(k, v) {
  try {
    if (v === undefined) return sessionStorage.getItem(k);
    if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v);
  } catch (e) { /* abaikan */ }
  return null;
}
var toastT;
function toast(msg, ms) {
  var t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('hidden'); }, ms || 3600);
}
var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtDate(s) { if (!s) return '-'; var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : s; }
function fmtDT(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return m ? (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] + ', ' + m[4] + ':' + m[5] : fmtDate(s); }
function ago(s) {
  var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return '';
  var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5]);
  var d = (Date.now() - t) / 60000;
  if (d < 1) return 'baru saja'; if (d < 60) return Math.round(d) + ' mnt lalu';
  if (d < 1440) return Math.round(d / 60) + ' jam lalu'; return fmtDT(s);
}
function fmtSize(n) { n = +n || 0; if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB'; if (n >= 1024) return Math.round(n / 1024) + ' KB'; return n + ' B'; }
function initials(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }

/* ================= state ================= */
var S = {
  token: null, user: null, boot: null, dash: null, events: [], rev: null,
  tab: 'home', filter: { q: '', outlet: '', status: '' }, adminTab: 'users',
  form: null, online: navigator.onLine, reg: null, updateReady: false,
  sendProg: {}, proc: {}, procWait: {}, localDrafts: [], lastSync: 0
};
var T; // status labels
function role() { return S.user ? S.user.role : ''; }
function isAdmin() { return role() === 'admin'; }
function canInput() { return role() === 'mekanik' || role() === 'admin'; }
function canValidate() { return role() === 'foreman' || role() === 'admin'; }
function coversOutlet(o) { var u = S.user; return u.role === 'admin' || u.outlet === '*' || String(u.outlet).toLowerCase() === String(o).toLowerCase(); }

/* ================= API ================= */
function AppError(msg, kind) { this.message = msg; this.kind = kind || 'app'; }
AppError.prototype = Object.create(Error.prototype);
AppError.prototype.name = 'AppError';

function errMsg(e) { return (e && e.message) ? String(e.message).replace(/^(Error|Exception):\s*/, '') : String(e); }
function isRetryable(e) {
  if (!e) return false;
  if (e.kind === 'net' || e.kind === 'server') return true;
  return /\(\d{3}\)|too many|timed out|timeout|sibuk|internal|server|bandwidth|address unavailable|coba lagi/i.test(errMsg(e));
}

function api(action) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (!navigator.onLine) return Promise.reject(new AppError('Tidak ada koneksi internet.', 'net'));
  var ctrl = window.AbortController ? new AbortController() : null;
  var ms = action === 'uploadChunk' ? 150000 : action === 'printCase' ? 240000 : 70000;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
  return fetch(CONFIG.API_URL, {
    method: 'POST', redirect: 'follow', cache: 'no-store',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: action, token: S.token, args: args }),
    signal: ctrl ? ctrl.signal : undefined
  }).then(function (res) {
    return res.text().then(function (txt) {
      var j;
      try { j = JSON.parse(txt); } catch (e) {
        if (/accounts\.google\.com|ServiceLogin/i.test(txt)) throw new AppError('Server minta login Google. Admin perlu mengatur akses deployment Apps Script ke "Siapa saja".', 'config');
        if (/doPost|Script function not found|Fungsi skrip tidak ditemukan/i.test(txt)) throw new AppError('Server sedang diperbarui ke versi 2. Coba lagi beberapa menit. (Admin: tempel Code.gs terbaru di Apps Script lalu Terapkan versi baru.)', 'config');
        throw new AppError('Server Google sedang sibuk. Coba lagi sebentar.', 'server');
      }
      if (!j.ok) {
        if (j.error === 'AUTH') { onAuthLost(); throw new AppError('Sesi berakhir, silakan login lagi.', 'auth'); }
        throw new AppError(j.error, 'app');
      }
      return j.data;
    });
  }, function (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(navigator.onLine ? 'Tidak bisa terhubung ke server. Periksa koneksi internet.' : 'Tidak ada koneksi internet.', 'net');
  }).finally(function () { clearTimeout(timer); });
}

/** Panggilan aman untuk dibaca (diulang otomatis bila koneksi bermasalah). */
function apiRetry(action) {
  var args = arguments, tries = 0;
  function go() {
    return api.apply(null, args).catch(function (e) {
      if (++tries <= 2 && (e.kind === 'net' || e.kind === 'server')) return sleep(1200 * tries).then(go);
      throw e;
    });
  }
  return go();
}

/* ================= IndexedDB (draft & file) ================= */
var DB = {
  db: null,
  open: function () {
    if (DB.db) return Promise.resolve(DB.db);
    return new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('IndexedDB tidak tersedia')); return; }
      var r = indexedDB.open('vtag', 2);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('drafts')) d.createObjectStore('drafts', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'id' });
      };
      r.onsuccess = function () { DB.db = r.result; DB.db.onversionchange = function () { DB.db.close(); DB.db = null; }; res(DB.db); };
      r.onerror = function () { rej(r.error); };
    });
  },
  tx: function (st, mode, fn) {
    return DB.open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(st, mode), out;
        var s = t.objectStore(st);
        var req = fn(s);
        if (req) req.onsuccess = function () { out = req.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error || new Error('Gagal menyimpan di HP')); };
        t.onabort = function () { rej(t.error || new Error('Penyimpanan HP penuh / file tidak bisa dibaca')); };
      });
    });
  },
  get: function (st, id) { return DB.tx(st, 'readonly', function (s) { return s.get(id); }); },
  put: function (st, obj) { return DB.tx(st, 'readwrite', function (s) { return s.put(obj); }); },
  del: function (st, id) { return DB.tx(st, 'readwrite', function (s) { return s.delete(id); }); },
  all: function (st) { return DB.tx(st, 'readonly', function (s) { return s.getAll(); }); }
};
var MEMBLOB = {}; // cadangan bila IndexedDB gagal
var Blobs = {
  put: function (id, blob) { return DB.put('blobs', { id: id, blob: blob }).catch(function (e) { MEMBLOB[id] = blob; throw e; }); },
  get: function (id) { return DB.get('blobs', id).then(function (r) { return r ? r.blob : (MEMBLOB[id] || null); }, function () { return MEMBLOB[id] || null; }); },
  del: function (id) { delete MEMBLOB[id]; return DB.del('blobs', id).catch(function () {}); }
};
var Drafts = {
  q: {},
  get: function (id) { return DB.get('drafts', id).catch(function () { return null; }); },
  save: function (d) {
    d.updatedAt = Date.now();
    var copy = JSON.parse(JSON.stringify(d));
    var prev = Drafts.q[d.id] || Promise.resolve();
    var p = prev.then(function () { return DB.put('drafts', copy); }).catch(function () {});
    Drafts.q[d.id] = p;
    return p;
  },
  remove: function (d) {
    var ids = Object.keys(d.files || {}).map(function (k) { return d.files[k] && d.files[k].blobId; }).filter(Boolean);
    return Promise.all(ids.map(Blobs.del)).then(function () { return DB.del('drafts', d.id).catch(function () {}); }).then(refreshLocalDrafts);
  },
  mine: function () {
    return DB.all('drafts').then(function (list) {
      return (list || []).filter(function (d) { return S.user && d.user === S.user.username; });
    }).catch(function () { return []; });
  }
};
function refreshLocalDrafts() {
  return Drafts.mine().then(function (l) { S.localDrafts = l; renderNav(); return l; });
}

/* ================= kompres foto & video ================= */
function canvasToBlob(cv, type, q) { return new Promise(function (r) { cv.toBlob(r, type, q); }); }

function makeThumb(source) {
  try {
    var w = source.width || source.videoWidth, h = source.height || source.videoHeight;
    if (!w || !h) return null;
    var s = 112 / Math.max(w, h), cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
    cv.getContext('2d').drawImage(source, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.7);
  } catch (e) { return null; }
}

/* ---------- watermark (dokumentasi warranty) ---------- */
function tzLabel() {
  var o = -new Date().getTimezoneOffset() / 60;
  return o === 7 ? 'WIB' : o === 8 ? 'WITA' : o === 9 ? 'WIT' : 'GMT' + (o >= 0 ? '+' : '') + o;
}
function fmtStamp(ms) {
  var d = new Date(ms), p = function (n) { return ('0' + n).slice(-2); };
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + ' ' + tzLabel();
}
/** Info watermark untuk satu file. src: 'cam' (kamera aplikasi) / 'gal' (galeri / file). */
function wmInfo(F, item, file, src) {
  var v = F.v || {};
  var t = src === 'cam' ? Date.now() : (file.lastModified && file.lastModified > 1420070400000 ? file.lastModified : Date.now());
  return { t: t, src: src, vin: String(v.vin || '').toUpperCase(), nopol: String(v.nopol || '').toUpperCase(), outlet: v.outlet || S.user.outlet, user: S.user.nama, label: item.label };
}
function fitFont(ctx, text, weight, size, maxW) {
  var fs = size;
  ctx.font = weight + ' ' + fs + 'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  while (fs > 9 && ctx.measureText(text).width > maxW) { fs -= 1; ctx.font = weight + ' ' + fs + 'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'; }
  return fs;
}
/** Gambar watermark di bagian bawah frame. t = waktu (ms) yang ditampilkan. */
function drawWatermark(ctx, w, h, info, t) {
  var base = Math.max(14, Math.round(Math.min(w, h) * 0.034));
  var pad = Math.round(base * 0.7), lh = Math.round(base * 1.32);
  var lines = [
    [fmtStamp(t) + (info.src === 'gal' ? '  (galeri)' : ''), '800', base * 1.15, '#ffffff'],
    [[info.vin ? 'VIN ' + info.vin : 'VIN -', info.nopol].filter(Boolean).join('  ·  '), '600', base * 0.92, 'rgba(255,255,255,.95)'],
    [[info.outlet, info.user, info.label].filter(Boolean).join('  ·  '), '500', base * 0.86, 'rgba(255,255,255,.9)']
  ];
  var boxH = pad * 2 + lh * lines.length;
  ctx.save();
  var g = ctx.createLinearGradient(0, h - boxH * 1.5, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.35, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,.72)');
  ctx.fillStyle = g; ctx.fillRect(0, h - boxH * 1.5, w, boxH * 1.5);
  ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = Math.max(2, base * 0.15);
  // garis aksen oranye
  ctx.fillStyle = '#ff6400'; ctx.fillRect(pad, h - boxH + pad, Math.max(3, Math.round(base * 0.18)), lh * lines.length - Math.round(lh * 0.25));
  var x = pad + Math.max(3, Math.round(base * 0.18)) + Math.round(base * 0.55);
  lines.forEach(function (l, i) {
    fitFont(ctx, l[0], l[1], Math.round(l[2]), w - x - pad);
    ctx.fillStyle = l[3];
    ctx.fillText(l[0], x, h - boxH + pad + i * lh);
  });
  // label merek di pojok kanan atas
  var tag = 'OTOKLIX · VTAG', tfs = Math.max(11, Math.round(base * 0.72));
  ctx.shadowBlur = 0;
  ctx.font = '800 ' + tfs + 'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  var tw = ctx.measureText(tag).width, bx = w - pad - tw - tfs, by = pad;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by, tw + tfs, tfs * 1.7);
  ctx.fillStyle = '#ff7a26'; ctx.fillText(tag, bx + tfs / 2, by + tfs * 0.35);
  ctx.restore();
}

/**
 * Foto: (1) watermark tanggal-jam, VIN, Nopol, outlet, mekanik; (2) perkecil maks 2560 px JPEG 86%.
 * Tanpa kompres: resolusi asli (maks 4096 px) JPEG 92%.
 */
function compressImage(file, allow, wm) {
  if (!window.createImageBitmap || !/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type || '')) return Promise.resolve(null);
  return createImageBitmap(file).then(function (bmp) {
    var thumb = makeThumb(bmp);
    if (!wm && (!allow || file.size < CONFIG.IMG_MIN_BYTES)) { bmp.close && bmp.close(); return { thumb: thumb }; }
    var maxSide = allow ? CONFIG.IMG_MAX : 4096;
    var sc = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    var cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    bmp.close && bmp.close();
    if (wm) { drawWatermark(ctx, cv.width, cv.height, wm, wm.t); thumb = makeThumb(cv) || thumb; }
    return canvasToBlob(cv, 'image/jpeg', allow ? CONFIG.IMG_Q : 0.92).then(function (b) {
      if (!b) return { thumb: thumb };
      if (!wm && b.size >= file.size * 0.9) return { thumb: thumb };
      return { blob: b, type: 'image/jpeg', name: String(file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg', thumb: thumb, wm: !!wm };
    });
  }).catch(function () { return null; });
}

function videoMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return null;
  var c = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i];
  return null;
}
function canCompressVideo() {
  var cv = document.createElement('canvas');
  return !isIOS() && !!videoMime() && !!cv.captureStream && !!(window.AudioContext || window.webkitAudioContext);
}

/**
 * Video: diputar ulang di latar & direkam ulang maks 1080p (bitrate ±6 Mbps) — tetap jelas,
 * ukuran turun 50–80%. Butuh waktu sepanjang durasi video. Gagal/dibatalkan = pakai file asli.
 */
function compressVideo(file, onProgress, signal, wm) {
  return new Promise(function (resolve) {
    var url = URL.createObjectURL(file), done = false, rec, ac, timer, rafId, chunks = [], thumb = null;
    var v = document.createElement('video');
    v.playsInline = true; v.preload = 'auto'; v.src = url; v.muted = false;
    v.setAttribute('playsinline', '');
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0';
    document.body.appendChild(v);
    function finish(out, reason) {
      if (done) return; done = true;
      clearTimeout(timer); if (rafId) cancelAnimationFrame(rafId);
      try { v.pause(); } catch (e) { /* */ }
      try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { /* */ }
      try { ac && ac.close(); } catch (e) { /* */ }
      v.remove(); URL.revokeObjectURL(url);
      resolve({ out: out, thumb: thumb, reason: reason });
    }
    if (signal) signal.addEventListener('abort', function () { finish(null, 'batal'); });
    timer = setTimeout(function () { finish(null, 'timeout'); }, 15000);
    v.onerror = function () { finish(null, 'format'); };
    v.onloadedmetadata = function () {
      clearTimeout(timer);
      var W = v.videoWidth, H = v.videoHeight, dur = v.duration;
      if (!W || !H || !isFinite(dur) || dur <= 0) { finish(null, 'format'); return; }
      if (dur > CONFIG.VID_MAX_SECONDS) { finish(null, 'panjang'); return; }
      var sc = Math.min(1, 1920 / Math.max(W, H));
      var w = Math.round(W * sc / 2) * 2, h = Math.round(H * sc / 2) * 2;
      var br = Math.round(Math.max(2500000, Math.min(6500000, 6000000 * (w * h) / (1920 * 1080))));
      var est = br / 8 * dur + 160000 / 8 * dur;
      if (wm) {
        // video diberi watermark: kualitas dijaga setara aslinya (tidak lebih dari 6,5 Mbps)
        var orig = file.size * 8 / dur;
        br = Math.round(Math.max(1500000, Math.min(br, orig * 1.05)));
      } else if (est > file.size * 0.8) { finish(null, 'sudah kecil'); return; }
      var t0 = wm ? (wm.src === 'cam' ? Date.now() - dur * 1000 : (wm.t - dur * 1000)) : 0;
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d');
      var stream = cv.captureStream(30);
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC();
        var src = ac.createMediaElementSource(v), dest = ac.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
      } catch (e) { finish(null, 'audio'); return; }
      var mime = videoMime();
      try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: br, audioBitsPerSecond: 160000 }); }
      catch (e) { finish(null, 'encoder'); return; }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        if (done && !v.ended) return;
        var type = mime.split(';')[0];
        var out = new Blob(chunks, { type: type });
        if (!out.size || out.size >= file.size * (wm ? 1.6 : 0.85)) { finish(null, 'tidak lebih kecil'); return; }
        var ext = /mp4/.test(type) ? '.mp4' : '.webm';
        finish({ blob: out, type: type, name: String(file.name || 'video').replace(/\.[^.]+$/, '') + ext, wm: !!wm }, 'ok');
      };
      function paint() {
        try { ctx.drawImage(v, 0, 0, w, h); } catch (e) { /* */ }
        if (wm) drawWatermark(ctx, w, h, wm, t0 + v.currentTime * 1000);
      }
      function draw() {
        if (done) return;
        paint();
        if (!thumb && v.currentTime > 0.2) thumb = makeThumb(cv);
        if (onProgress) onProgress(Math.min(0.99, v.currentTime / dur), Math.max(0, dur - v.currentTime));
        rafId = requestAnimationFrame(draw);
      }
      v.onended = function () {
        if (done) return;
        paint();
        setTimeout(function () { try { rec.stop(); } catch (e) { finish(null, 'encoder'); } }, 250);
      };
      var go = function () {
        ac.resume().catch(function () {});
        rec.start(1000);
        draw();
      };
      v.play().then(go, function () { finish(null, 'izin'); });
    };
  });
}

function ab2b64(buf) {
  var bytes = new Uint8Array(buf), s = '';
  for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/* ================= tombol kembali (Android) ================= */
var Back = {
  t: null,
  init: function () { window.addEventListener('popstate', Back.onPop); },
  arm: function () {
    if (history.state && history.state.vtTrap) return;
    try { history.pushState({ vtTrap: true }, ''); } catch (e) { /* */ }
  },
  onPop: function () {
    if (!S.user || !$('#app')) return; // layar login: biarkan keluar
    clearTimeout(Back.t);
    if ($('#ov')) {
      if (!modalLock) { closeModal(); if (sendSheetId) { sendSheetId = null; renderPill(); } }
      Back.arm(); return;
    }
    if (S.tab !== 'home') {
      var wasInput = S.tab === 'input';
      go('home');
      if (wasInput) toast('Draft tersimpan otomatis. Lanjutkan kapan saja dari menu Input.');
      Back.arm(); return;
    }
    // di Beranda: tekan sekali lagi dalam 2 detik untuk keluar
    toast('Tekan kembali sekali lagi untuk keluar aplikasi', 2000);
    Back.t = setTimeout(Back.arm, 2200);
  }
};

/* ================= start ================= */
window.addEventListener('DOMContentLoaded', init);

function init() {
  setupSW();
  Back.init();
  window.addEventListener('online', function () { S.online = true; renderNetbar(); toast('Koneksi kembali. Melanjutkan…'); syncNow(); resumeSending(); });
  window.addEventListener('offline', function () { S.online = false; renderNetbar(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (S.updateReady && !busy()) { applyUpdate(); return; }
      syncNow(); resumeSending(); if (anySending()) wake(true);
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.eye');
    if (!b) return;
    var inp = b.parentNode.querySelector('input');
    if (!inp) return;
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.classList.toggle('on', show); b.innerHTML = ic(show ? 'eyeoff' : 'eye');
    b.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  });
  var qm = location.search.match(/[?&]case=([^&]+)/);
  if (qm) { S.openAfterBoot = decodeURIComponent(qm[1]); try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* */ } }
  S.token = store('vt_token') || sstore('vt_token');
  if (!S.token) { showLogin(); return; }
  var cached = store('vt_boot');
  if (cached) { try { applyBoot(JSON.parse(cached)); showApp(); } catch (e) { /* */ } }
  loadBoot();
}

function loadBoot() {
  return apiRetry('bootstrap').then(function (b) {
    applyBoot(b);
    try { store('vt_boot', JSON.stringify(b)); } catch (e) { /* */ }
    showApp();
    if (b.mustChange) showPwModal(true);
    else if (S.openAfterBoot) { openCase(S.openAfterBoot); S.openAfterBoot = null; }
    startPolling();
    resumeSending();
    saveAuthMeta(); markPushSeen();
    if (window.Notification && Notification.permission === 'granted') ensurePush(false);
  }, function (e) {
    if (e.kind === 'auth') return;
    if (S.boot) { renderNetbar(); startPolling(); return; }
    showLogin(errMsg(e));
  });
}

function applyBoot(b) {
  S.boot = b; S.user = b.user; T = b.status; S.dash = b.dash; S.events = b.events || []; S.rev = b.rev;
}

/* ================= login ================= */
function showLogin(err) {
  document.body.classList.add('nonav');
  $('#modalHost').innerHTML = '';
  var lastU = store('vt_user') || '';
  $('#root').innerHTML =
    '<div class="login-wrap"><div class="login-top"><div class="logo-card"><img alt="Otoklix" src="icons/logo-otoklix.png"></div>' +
    '<h1>Workshop Investigation</h1><p>Form investigasi & VTAG untuk mekanik dan foreman</p></div>' +
    '<form class="login" id="fLogin" autocomplete="on" method="post" action="#">' +
    '<div class="field">' + ic('user') + '<input id="lu" name="username" type="text" placeholder="Username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required value="' + esc(lastU) + '"></div>' +
    '<div class="field pw">' + ic('key') + '<input id="lp" name="password" type="password" placeholder="Password" autocomplete="current-password" required><button type="button" class="eye" aria-label="Tampilkan password">' + ic('eye') + '</button></div>' +
    '<label class="check"><input type="checkbox" id="lr" checked> Tetap masuk & simpan password di HP ini</label>' +
    '<div id="lerr" class="msg err ' + (err ? '' : 'hidden') + '">' + ic('warn') + '<span>' + esc(err || '') + '</span></div>' +
    '<button class="btn or block" id="lbtn" type="submit" style="margin-top:8px">Masuk</button>' +
    '<p class="small muted" style="margin:14px 0 0;text-align:center">Lupa password? Hubungi admin untuk reset.</p>' +
    '<div class="by"><span>Didukung</span><img alt="Oto Academy" src="icons/logo-otoacademy.png"></div></form></div>';
  $('#fLogin').addEventListener('submit', onLogin);
  if (window.PasswordCredential && navigator.credentials && navigator.credentials.get) {
    navigator.credentials.get({ password: true, mediation: 'optional' }).then(function (c) {
      if (c && c.type === 'password' && c.id && $('#lu')) { $('#lu').value = c.id; if (c.password) $('#lp').value = c.password; }
    }).catch(function () {});
  }
  if (!lastU) setTimeout(function () { var u = $('#lu'); if (u) u.focus(); }, 300);
}

function onLogin(ev) {
  ev.preventDefault();
  var b = $('#lbtn'), er = $('#lerr'), u = $('#lu').value.trim(), p = $('#lp').value, remember = $('#lr').checked;
  er.classList.add('hidden'); b.disabled = true; b.textContent = 'Memeriksa…';
  api('login', u, p).then(function (r) {
    S.token = r.token;
    if (remember) { store('vt_token', r.token); sstore('vt_token', null); } else { sstore('vt_token', r.token); store('vt_token', null); }
    store('vt_user', u.toLowerCase());
    if (remember && window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
      try { navigator.credentials.store(new PasswordCredential({ id: u.toLowerCase(), password: p, name: r.user.nama })).catch(function () {}); } catch (e) { /* */ }
    }
    return loadBoot();
  }).catch(function (e) {
    er.querySelector('span').textContent = errMsg(e); er.classList.remove('hidden');
  }).finally(function () { if ($('#lbtn')) { b.disabled = false; b.textContent = 'Masuk'; } });
}

function onAuthLost() {
  if (!S.token) return;
  S.token = null; store('vt_token', null); sstore('vt_token', null); store('vt_boot', null);
  stopPolling(); DB.del('meta', 'auth').catch(function () {});
  showLogin('Sesi berakhir (password direset atau akun dinonaktifkan). Silakan login lagi.');
}

function doLogout() {
  var unsent = S.localDrafts.filter(function (d) { return d.state === 'sending' || d.state === 'error'; }).length;
  confirmBox({
    title: 'Keluar dari aplikasi?',
    body: unsent ? 'Ada ' + unsent + ' data yang belum terkirim. Data itu tetap tersimpan di HP dan bisa dilanjutkan setelah login lagi.' : 'Anda perlu login lagi untuk masuk.',
    ok: 'Keluar', danger: true
  }).then(function (yes) {
    if (!yes) return;
    busyModal('Keluar…');
    Promise.race([pushOff().then(function () { return api('logout'); }).catch(function () {}), sleep(5000)]).then(function () {
      S.token = null; store('vt_token', null); sstore('vt_token', null); store('vt_boot', null);
      stopPolling(); closeModal(); showLogin();
    });
  });
}

/* ================= kerangka aplikasi ================= */
function showApp() {
  document.body.classList.remove('nonav');
  if (!$('#app')) {
    $('#root').innerHTML =
      '<div id="app"><aside class="side" id="side"></aside>' +
      '<header class="top"><img class="logo" alt="Otoklix" src="icons/logo-otoklix.png"><div class="sp"></div>' +
      '<button class="hbtn" id="btnBell" aria-label="Notifikasi">' + ic('bell') + '<span class="dot hidden" id="bellDot"></span></button>' +
      '<button class="avatar" id="btnMe" aria-label="Akun"></button></header>' +
      '<div id="netbar"></div><main id="main"></main>' +
      '<nav class="bottom"><div class="in" id="tabs"></div></nav><div id="pillHost"></div></div>';
    $('#btnMe').onclick = showAccount;
    $('#btnBell').onclick = showNotifs;
  }
  $('#btnMe').textContent = initials(S.user.nama);
  Back.arm();
  refreshLocalDrafts();
  renderNetbar(); renderNav(); renderView(); renderBell(); renderPill();
}

function tabsDef() {
  var t = [{ k: 'home', l: 'Beranda', i: 'home' }];
  var vCount = canValidate() ? pendingForMe().length : 0;
  if (role() === 'mekanik') {
    t.push({ k: 'input', l: 'Input', i: 'plus', cta: true });
    t.push({ k: 'data', l: 'Data', i: 'list', n: todoCount() });
  } else if (role() === 'foreman') {
    t.push({ k: 'data', l: 'Data', i: 'list' });
    t.push({ k: 'validasi', l: 'Validasi', i: 'check', n: vCount });
    t.push({ k: 'bulk', l: 'Tugaskan', i: 'users' });
  } else if (role() === 'sm') {
    t.push({ k: 'data', l: 'Data', i: 'list' });
    t.push({ k: 'admin', l: 'Kelola', i: 'gear' });
  } else if (role() === 'partman') {
    t.push({ k: 'data', l: 'Data', i: 'list', n: partReady().length });
  } else {
    t.push({ k: 'data', l: 'Data', i: 'list' });
    t.push({ k: 'input', l: 'Input', i: 'plus', cta: true });
    t.push({ k: 'validasi', l: 'Validasi', i: 'check', n: vCount });
    t.push({ k: 'admin', l: 'Admin', i: 'gear' });
  }
  return t;
}

function renderNav() {
  if (!$('#tabs') || !S.user) return;
  var defs = tabsDef();
  $('#tabs').innerHTML = defs.map(function (t) {
    return '<button data-k="' + t.k + '" class="' + (S.tab === t.k ? 'on ' : '') + (t.cta ? 'cta' : '') + '">' +
      (t.cta ? '<span class="ic">' + ic(t.i, 'lg') + '</span>' : ic(t.i)) + '<span>' + esc(t.l) + '</span>' +
      (t.n ? '<span class="badge">' + t.n + '</span>' : '') + '</button>';
  }).join('');
  var side = defs.slice();
  if (isManager()) { side = side.filter(function (x) { return x.k !== 'admin'; }); adminTabs().forEach(function (a) { side.push({ k: 'adm:' + a[0], l: a[1], i: a[2] }); }); }
  side.sort(function (a, b) { return (b.cta ? 1 : 0) - (a.cta ? 1 : 0); });
  $('#side').innerHTML = '<img alt="Otoklix" src="icons/logo-otoklix.png">' + side.map(function (t) {
    var on = S.tab === t.k || (S.tab === 'admin' && t.k === 'adm:' + S.adminTab);
    return '<button data-k="' + t.k + '" class="' + (on ? 'on ' : '') + (t.cta ? 'cta' : '') + '">' + ic(t.i) + '<span>' + (t.cta ? 'Input kasus baru' : esc(t.l)) + '</span>' + (t.n ? '<span class="badge">' + t.n + '</span>' : '') + '</button>';
  }).join('') + '<div class="ver">Versi ' + CONFIG.VERSION + '</div>';
  $$('#tabs button, #side button').forEach(function (b) {
    b.onclick = function () {
      var k = b.dataset.k;
      if (k.indexOf('adm:') === 0) { S.adminTab = k.slice(4); k = 'admin'; }
      go(k);
    };
  });
}

function go(k, opts) {
  if (S.tab === 'input' && k !== 'input') flushForm();
  S.tab = k;
  if (k === 'input' && !(opts && opts.keepForm)) S.form = null;
  renderNav(); renderView(); window.scrollTo(0, 0);
}

function renderView() {
  var m = $('#main');
  if (!m || !S.user) return;
  if (S.tab === 'home') return renderHome(m);
  if (S.tab === 'data') return renderList(m, 'data');
  if (S.tab === 'validasi') return renderList(m, 'validasi');
  if (S.tab === 'input') return renderForm(m);
  if (S.tab === 'admin') return renderAdmin(m);
  if (S.tab === 'bulk') return renderBulkPage(m);
  S.tab = 'home'; renderHome(m);
}

function renderNetbar() {
  var el = $('#netbar');
  if (!el) return;
  if (!navigator.onLine) {
    el.innerHTML = '<div class="netbar off">' + ic('wifioff') + '<span class="grow">Tidak ada koneksi internet. Data aman tersimpan di HP & upload lanjut otomatis saat online.</span></div>';
  } else if (S.updateReady) {
    el.innerHTML = '<div class="netbar upd">' + ic('refresh') + '<span class="grow">Versi baru aplikasi tersedia.</span><button id="btnUpd">Perbarui</button></div>';
    $('#btnUpd').onclick = function () {
      if (anySending()) { toast('Tunggu upload selesai dulu, lalu perbarui.'); return; }
      flushForm(); applyUpdate();
    };
  } else el.innerHTML = '';
}

/* ================= data helpers ================= */
function rows() { return (S.dash && S.dash.rows) || []; }
function pendingForMe() {
  return rows().filter(function (r) { return (r.status === T.PENDING || r.status === T.SUBMITTED) && r.by !== S.user.username && coversOutlet(r.outlet); });
}
function needCheck() { return pendingForMe().filter(function (r) { return r.status === T.PENDING; }); }
function waitApproval() { return pendingForMe().filter(function (r) { return r.status === T.SUBMITTED; }); }
function partReady() { return role() === 'partman' ? rows().filter(function (r) { return r.status === T.DONE && r.after === S.boot.after.WAIT; }) : []; }
function afterWaitForMe() {
  return canInput() ? rows().filter(function (r) { return r.status === T.DONE && r.after === S.boot.after.WAIT && !r.driveDel && coversOutlet(r.outlet); }) : [];
}
function revisiMine() { return rows().filter(function (r) { return r.status === T.REVISI && r.by === S.user.username; }); }
function draftMine() { return rows().filter(function (r) { return r.status === T.DRAFT && r.by === S.user.username; }); }
function unsentLocal() { return S.localDrafts.filter(function (d) { return d.state === 'sending' || d.state === 'error'; }); }
function todoCount() { return revisiMine().length + afterWaitForMe().length + unsentLocal().length; }

function pillClass(st) { return st === T.PENDING ? 'pending' : st === T.SUBMITTED ? 'sub' : st === T.DONE ? 'done' : st === T.REVISI ? 'revisi' : 'draft'; }
function pillIcon(st) { return st === T.PENDING ? 'clock' : st === T.SUBMITTED ? 'send' : st === T.DONE ? 'check' : st === T.REVISI ? 'undo' : 'edit'; }
function pill(st) { return '<span class="pill ' + pillClass(st) + '">' + ic(pillIcon(st), 'sm') + esc(st) + '</span>'; }
function afterPill(a) {
  if (!a) return '';
  return '<span class="pill ' + (a === S.boot.after.DONE ? 'done' : 'after') + '">' + ic(a === S.boot.after.DONE ? 'box' : 'clock', 'xs') + esc(a === S.boot.after.DONE ? 'After lengkap' : 'Menunggu after') + '</span>';
}

/* ================= sinkron & notifikasi ================= */
var pollT = null;
function startPolling() {
  stopPolling();
  pollT = setInterval(function () {
    if (document.visibilityState === 'visible' || anySending()) syncNow();
  }, CONFIG.POLL_MS);
}
function stopPolling() { if (pollT) clearInterval(pollT); pollT = null; }
var syncing = false;
function syncNow() {
  if (!S.token || !S.user || syncing || !navigator.onLine) return Promise.resolve();
  syncing = true;
  return api('sync', S.rev).then(function (r) {
    S.lastSync = Date.now();
    if (r.same) return;
    S.rev = r.rev;
    if (r.dash) S.dash = r.dash;
    if (r.settings) S.boot.settings = r.settings;
    if (r.campaigns) S.boot.campaigns = r.campaigns;
    if (r.events) { S.events = r.events; notifyNew(); }
    try { var b = S.boot; b.dash = S.dash; b.events = S.events; b.rev = S.rev; store('vt_boot', JSON.stringify(b)); } catch (e) { /* */ }
    renderNav(); renderBell();
    if (S.tab !== 'input' && S.tab !== 'admin' && S.tab !== 'bulk') renderView();
  }).catch(function () { /* diam: dicoba lagi berikutnya */ }).finally(function () { syncing = false; renderNetbar(); });
}

function seenKey() { return 'vt_seen_' + S.user.username; }
function unreadEvents() { var seen = store(seenKey()) || ''; return S.events.filter(function (e) { return e.ts > seen; }); }
function renderBell() {
  var n = unreadEvents().length, d = $('#bellDot');
  if (!d) return;
  d.textContent = n > 9 ? '9+' : n; d.classList.toggle('hidden', !n);
}
function evIcon(t) { return t === 'validated' || t === 'approved' ? 'check' : t === 'submitted_vf' ? 'send' : t === 'revisi' ? 'undo' : t === 'after_done' ? 'box' : t === 'assigned' ? 'users' : 'inbox'; }
function markPushSeen() {
  if (!S.events.length) return;
  var ts = S.events[0].ts;
  DB.get('meta', 'pushSeen').then(function (x) { if (!x || x.ts < ts) return DB.put('meta', { id: 'pushSeen', ts: ts }); }).catch(function () {});
}
function notifyNew() {
  markPushSeen();
  var key = 'vt_notified_' + S.user.username, last = store(key);
  var fresh = S.events.filter(function (e) { return !last || e.ts > last; });
  if (S.events.length) store(key, S.events[0].ts);
  if (!last || !fresh.length) return;
  var e = fresh[0];
  toast('🔔 ' + e.message, 6000);
  if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (x) { /* */ }
  if (!S.pushOn && window.Notification && Notification.permission === 'granted' && document.visibilityState !== 'visible' && S.reg) {
    fresh.slice(0, 3).forEach(function (x) {
      S.reg.showNotification('VTAG Otoklix', { body: x.message, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'vt-' + x.caseId + '-' + x.type, data: { caseId: x.caseId } });
    });
  }
}
function showNotifs() {
  var seen = store(seenKey()) || '';
  var canAsk = window.Notification && Notification.permission === 'default';
  var pb = pushBanner();
  modal('<div class="row" style="justify-content:space-between"><h3>Notifikasi</h3><button class="btn sm sec" id="nRead">Tandai dibaca</button></div>' +
    (pb ? '<div style="margin-top:12px">' + pb + '</div>' : canAsk ? '<div class="msg info" style="margin-top:12px">' + ic('bell') + '<span>Aktifkan notifikasi HP supaya tahu saat ada kasus baru / hasil validasi. <button class="btn sm" id="nPerm" style="margin-top:8px">Aktifkan notifikasi</button></span></div>' : '') +
    '<div style="margin-top:10px">' + (S.events.length ? S.events.map(function (e, i) {
      return '<button class="notif ' + (e.ts > seen ? 'unread' : '') + '" data-i="' + i + '"><span class="ni">' + ic(evIcon(e.type)) + '</span><span class="nt">' + esc(e.message) + '<small>' + esc(ago(e.ts)) + ' · ' + esc(e.outlet) + '</small></span></button>';
    }).join('') : '<div class="empty">' + ic('bell') + '<div>Belum ada notifikasi.</div></div>') + '</div>' +
    '<button class="btn sec block" id="nClose" style="margin-top:14px">Tutup</button>', 'narrow');
  var markRead = function () { if (S.events.length) store(seenKey(), S.events[0].ts); renderBell(); };
  $('#nRead').onclick = function () { markRead(); $$('.notif.unread').forEach(function (x) { x.classList.remove('unread'); }); };
  $('#nClose').onclick = function () { markRead(); closeModal(); };
  if ($('#pushGo')) $('#pushGo').onclick = function () { this.disabled = true; ensurePush(true).then(function (ok) { toast(ok ? '🔔 Notifikasi HP aktif — akan berbunyi walau aplikasi ditutup.' : 'Notifikasi tidak diizinkan.'); showNotifs(); }); };
  if ($('#nPerm')) $('#nPerm').onclick = function () {
    Notification.requestPermission().then(function (p) { toast(p === 'granted' ? 'Notifikasi HP aktif.' : 'Notifikasi tidak diizinkan.'); showNotifs(); });
  };
  $$('.notif').forEach(function (b) { b.onclick = function () { markRead(); var e = S.events[+b.dataset.i]; closeModal(); openCase(e.caseId); }; });
}

/* ================= beranda ================= */
function kpi(n, l, c, i, f) { return '<button class="kpi ' + c + '" data-f="' + esc(f) + '"><div class="ic">' + ic(i, 'lg') + '</div><div><div class="n">' + n + '</div><div class="l">' + esc(l) + '</div></div></button>'; }
function todoItem(icon, color, title, sub, act) {
  return '<button class="todo" data-act="' + esc(act) + '"><span class="ti" style="background:var(--' + color + '-bg,var(--blue-l));color:var(--' + color + ',var(--blue))">' + ic(icon) + '</span><span class="tt"><b>' + esc(title) + '</b><span>' + esc(sub) + '</span></span>' + ic('chev', 'sm') + '</button>';
}

function renderHome(m) {
  var st = S.dash.stats, u = S.user;
  var hr = new Date().getHours(), sal = hr < 11 ? 'Selamat pagi' : hr < 15 ? 'Selamat siang' : hr < 18 ? 'Selamat sore' : 'Selamat malam';
  var h = '<div class="deskgrid"><div>';
  h += '<div class="hero"><h1>' + sal + ', ' + esc(String(u.nama).split(' ')[0]) + ' 👋</h1><p>' + esc(roleName(u.role)) + ' · ' + (u.outlet === '*' ? 'Semua outlet' : esc(u.outlet)) + '</p><div class="acts">' +
    (canInput() ? '<button class="btn or" data-act="new">' + ic('plus') + ' Input kasus baru</button>' : '') +
    (canValidate() && pendingForMe().length ? '<button class="btn white" data-act="val">' + ic('check') + ' ' + pendingForMe().length + ' perlu ditindaklanjuti</button>' : '') +
    (role() === 'foreman' ? '<button class="btn white" data-act="bulk">' + ic('users') + ' Tugaskan kasus (massal)</button>' : '') +
    (role() === 'sm' ? '<button class="btn white" data-act="adm:export">' + ic('download') + ' Export Excel</button><button class="btn white" data-act="adm:users">' + ic('users') + ' Kelola akun</button>' : '') +
    (role() === 'partman' ? '<span class="tag" style="background:rgba(255,255,255,.2);color:#fff">' + ic('eye', 'xs') + ' Akses lihat saja</span>' : '') + '</div></div>';
  h += pushBanner();
  // perlu tindakan
  var todo = '';
  unsentLocal().forEach(function (d) {
    todo += todoItem('upload', 'bad', d.state === 'error' ? 'Data gagal terkirim' : 'Data sedang dikirim', (d.v && d.v.vin ? d.v.vin + ' · ' : '') + (d.kind === 'after' ? 'Dokumentasi after' : 'Kasus') + ' — ketuk untuk lanjut', 'draft:' + d.id);
  });
  revisiMine().forEach(function (r) { todo += todoItem('undo', 'bad', 'Perlu revisi', r.vin + ' · ' + r.nopol, 'case:' + r.id); });
  var newLocal = function (id) { return S.localDrafts.some(function (d) { return d.caseId === id && d.id.indexOf('new:') === 0 && d.state === 'editing'; }); };
  draftMine().forEach(function (r) { if (newLocal(r.id)) { todo += todoItem('edit', 'warn', 'Lanjutkan draft', r.vin + ' · ' + r.nopol + ' · ketuk untuk melanjutkan isian', 'new'); return; } todo += todoItem(r.asg ? 'users' : 'edit', 'warn', r.asg ? 'Tugas dari foreman ' + r.asg : 'Draft belum lengkap', r.vin + ' · ' + r.nopol + ' · ketuk untuk lengkapi data & file lalu kirim', 'case:' + r.id); });
  afterWaitForMe().forEach(function (r) { todo += todoItem('box', 'blue', 'Upload dokumentasi after', r.vin + ' · ' + r.nopol, 'after:' + r.id); });
  if (canValidate()) {
    needCheck().slice(0, 5).forEach(function (r) { todo += todoItem('clock', 'warn', 'Cek data & ajukan ke VinFast', r.vin + ' · ' + r.byName, 'case:' + r.id); });
    waitApproval().slice(0, 5).forEach(function (r) { todo += todoItem('send', 'blue', 'Menunggu approval VinFast', r.vin + ' · tandai jika sudah di-approve', 'case:' + r.id); });
  }
  partReady().slice(0, 8).forEach(function (r) { todo += todoItem('box', 'blue', 'Di-approve VinFast · siap part', r.vin + ' · ' + r.nopol + ' · ' + r.outlet, 'case:' + r.id); });
  if (todo) h += '<h2 style="font-size:16px;margin:4px 2px 10px">Perlu tindakan</h2>' + todo;
  h += '<div class="small muted" style="margin:14px 2px 8px">Total ' + st.total + ' kasus</div><div class="kpis">' + kpi(st.pending, 'Pending Input VTAG', 'warn', 'clock', T.PENDING) +
    kpi(st.submitted || 0, 'Diajukan ke VinFast', 'sub', 'send', T.SUBMITTED) +
    kpi(st.done, 'Sudah Terinput VTAG', 'ok', 'check', T.DONE) + kpi(st.revisi, 'Perlu Revisi', 'bad', 'undo', T.REVISI) + '</div>';
  h += '</div><div>';
  var outlets = Object.keys(st.byOutlet).sort();
  if (outlets.length > 1 || isAdmin()) {
    h += '<div class="card"><h2><span class="hic">' + ic('pin') + '</span>Per outlet</h2>';
    if (!outlets.length) h += '<div class="muted">Belum ada data.</div>';
    outlets.forEach(function (o) {
      var d = st.byOutlet[o], t = d.total || 1;
      var sb = d.submitted || 0;
      h += '<div class="obar"><div class="top"><b>' + esc(o) + '</b><span class="muted small">' + d.done + ' selesai · ' + sb + ' diajukan · ' + d.pending + ' pending' + (d.revisi ? ' · ' + d.revisi + ' revisi' : '') + '</span></div><div class="track">' +
        '<span class="seg-d" style="width:' + (d.done / t * 100) + '%"></span><span class="seg-s" style="width:' + (sb / t * 100) + '%"></span><span class="seg-p" style="width:' + (d.pending / t * 100) + '%"></span><span class="seg-r" style="width:' + (d.revisi / t * 100) + '%"></span></div></div>';
    });
    h += '</div>';
  }
  if (canMonitorDrafts() && role() !== 'admin' || (isAdmin() && draftsAll().length)) {
    var dl = draftsAll().filter(function (r) { return r.by !== u.username; });
    h += '<div class="card"><h2><span class="hic">' + ic('edit') + '</span>Draft mekanik (sedang dikerjakan) <span class="tag">' + dl.length + '</span></h2>' +
      (dl.length ? '<div id="drafts"></div>' + (dl.length > 5 ? '<button class="btn sec block" data-act="drafts">Lihat semua draft</button>' : '') : '<div class="muted small">Tidak ada draft. Draft muncul di sini begitu mekanik mulai mengisi form (VIN & Nopol terisi).</div>') + '</div>';
  }
  h += '<div class="card"><h2><span class="hic">' + ic('clock') + '</span>Kasus terbaru</h2><div id="recent"></div>' +
    (rows().length > 5 ? '<button class="btn sec block" data-act="data">Lihat semua data</button>' : '') + '</div></div></div>';
  m.innerHTML = h;
  $('#recent').innerHTML = cardsHtml(rows().filter(function (r) { return r.status !== T.DRAFT || r.by === u.username; }).slice(0, 5)) || '<div class="empty">' + ic('inbox') + '<div>Belum ada kasus.</div></div>';
  if ($('#drafts')) $('#drafts').innerHTML = cardsHtml(draftsAll().filter(function (r) { return r.by !== u.username; }).sort(function (a, b) { return a.upd < b.upd ? 1 : -1; }).slice(0, 5));
  bindPushBanner(m);
  bindCaseClicks(m);
  $$('[data-act]', m).forEach(function (b) { b.onclick = function () { doAct(b.dataset.act); }; });
  $$('.kpi', m).forEach(function (b) { b.onclick = function () { S.filter.status = b.dataset.f; go('data'); }; });
}

function doAct(a) {
  if (a === 'new') return go('input');
  if (a === 'val') return go('validasi');
  if (a === 'data') return go('data');
  if (a === 'bulk') return go('bulk');
  if (a === 'drafts') { S.filter.status = T.DRAFT; return go('data'); }
  if (a.indexOf('adm:') === 0) { S.adminTab = a.slice(4); return go('admin'); }
  var p = a.split(':'), kind = p[0], id = p.slice(1).join(':');
  if (kind === 'case') return openCase(id);
  if (kind === 'after') return openAfterForm(id);
  if (kind === 'draft') {
    var d = S.localDrafts.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    if (d.state === 'sending' || d.state === 'error') { Sender.start(d.id); showSendSheet(d.id); return; }
  }
}

/* ================= daftar kasus ================= */
function cardsHtml(list) {
  return list.map(function (r) {
    return '<button class="case ' + pillClass(r.status) + '" data-id="' + esc(r.id) + '">' +
      '<div class="r1"><span class="vin mono">' + esc(r.vin) + '</span>' + pill(r.status) + '</div>' +
      '<div class="r2"><span>' + ic('car', 'sm') + esc(r.nopol) + ' · ' + esc(r.model) + '</span><span>' + ic('pin', 'sm') + esc(r.outlet) + '</span></div>' +
      '<div class="r3"><span>' + (r.type === 'Campaign' ? ic('box', 'sm') + ' <b style="color:var(--orange-d)">' + esc(r.cmp || 'Campaign') + '</b>' : (r.type === 'Electrical' ? ic('zap', 'sm') : ic('tool', 'sm')) + ' ' + esc(r.type || '-')) + ' · ' + esc(r.byName) + (r.asg ? ' <span class="tag">' + ic('users', 'xs') + 'dari ' + esc(r.asg) + '</span>' : '') + '</span><span>' +
      afterPill(r.after) + (r.driveDel ? ' <span class="tag">' + ic('trash', 'xs') + 'file dihapus</span>' : '') + ' ' + esc(r.status === T.DRAFT && r.upd ? 'diubah ' + ago(r.upd) : fmtDate(r.ts)) + '</span></div></button>';
  }).join('');
}
function tableHtml(list) {
  return '<table class="tbl"><thead><tr><th>Tanggal</th><th>No. VIN</th><th>Nopol</th><th>Outlet</th><th>Model</th><th>Jenis</th><th>Status</th><th>After</th><th>Mekanik</th></tr></thead><tbody>' +
    list.map(function (r) {
      return '<tr class="click case-row" data-id="' + esc(r.id) + '"><td>' + esc(fmtDate(r.ts)) + '</td><td class="mono">' + esc(r.vin) + '</td><td>' + esc(r.nopol) + '</td><td>' + esc(r.outlet) +
        '</td><td>' + esc(r.model) + '</td><td>' + esc(r.type === 'Campaign' ? 'Campaign: ' + r.cmp : r.type) + '</td><td>' + pill(r.status) + '</td><td>' + (afterPill(r.after) || '-') + (r.driveDel ? ' <span class="tag">file dihapus</span>' : '') + '</td><td>' + esc(r.byName) + '</td></tr>';
    }).join('') + '</tbody></table>';
}
function bindCaseClicks(root) {
  $$('.case, .case-row', root).forEach(function (b) { b.onclick = function () { openCase(b.dataset.id); }; });
}
function isDesk() { return window.matchMedia && window.matchMedia('(min-width:1024px)').matches; }

function renderList(m, mode) {
  var f = S.filter, list = rows();
  if (mode === 'validasi') list = pendingForMe();
  var outlets = Object.keys(S.dash.stats.byOutlet).sort();
  var h = '';
  if (mode === 'validasi') h += '<div class="hero"><h1>Validasi foreman</h1><p>1) Cek data → ajukan ke sistem VinFast → tandai <b>Diajukan ke VinFast</b>. 2) Setelah di-approve VinFast → tandai <b>Sudah Terinput VTAG</b>.</p></div>';
  else h += '<div class="hero"><h1>Data kasus</h1><p>' + (S.user.outlet === '*' || isAdmin() ? 'Semua outlet' : esc(S.user.outlet)) + ' · ' + list.length + ' kasus</p></div>';
  h += '<div class="search">' + ic('search') + '<input id="fq" type="search" placeholder="Cari VIN, Nopol, customer, mekanik…" value="' + esc(f.q) + '"></div>';
  if (mode === 'validasi') {
    var vf = f.vstatus || '';
    h += '<div class="chips" id="vchips">' + [['', 'Semua', list.length], [T.PENDING, 'Perlu dicek', needCheck().length], [T.SUBMITTED, 'Menunggu approval VinFast', waitApproval().length]]
      .map(function (c) { return '<button class="chip' + (vf === c[0] ? ' on' : '') + '" data-s="' + esc(c[0]) + '">' + c[1] + '<b>' + c[2] + '</b></button>'; }).join('') + '</div>';
  }
  if (mode !== 'validasi') {
    var cnt = function (fn) { return list.filter(fn).length; };
    var chips = [['', 'Semua', list.length], [T.PENDING, 'Pending', cnt(function (r) { return r.status === T.PENDING; })],
      [T.SUBMITTED, 'Diajukan VinFast', cnt(function (r) { return r.status === T.SUBMITTED; })],
      [T.DONE, 'Sudah', cnt(function (r) { return r.status === T.DONE; })], [T.REVISI, 'Revisi', cnt(function (r) { return r.status === T.REVISI; })],
      ['after', 'Menunggu after', cnt(function (r) { return r.after === S.boot.after.WAIT; })]];
    if (role() !== 'partman') chips.push([T.DRAFT, 'Draft', cnt(function (r) { return r.status === T.DRAFT; })]);
    if (campaignsActive().length || list.some(function (r) { return r.type === 'Campaign'; })) chips.push(['campaign', 'Campaign', cnt(function (r) { return r.type === 'Campaign'; })]);
    h += '<div class="chips" id="chips">' + chips.map(function (c) { return '<button class="chip' + (f.status === c[0] ? ' on' : '') + '" data-s="' + esc(c[0]) + '">' + c[1] + '<b>' + c[2] + '</b></button>'; }).join('') + '</div>';
    if (outlets.length > 1) h += '<select class="slim" id="fo"><option value="">Semua outlet</option>' + outlets.map(function (o) { return '<option' + (f.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
  }
  h += '<div id="list"></div>';
  m.innerHTML = h;
  var draw = function () {
    var q = f.q.trim().toLowerCase();
    var l = list.filter(function (r) {
      if (mode === 'validasi' && f.vstatus && r.status !== f.vstatus) return false;
      if (mode !== 'validasi') {
        if (f.status === 'after') { if (r.after !== S.boot.after.WAIT) return false; }
        else if (f.status === 'campaign') { if (r.type !== 'Campaign') return false; }
        else if (f.status && r.status !== f.status) return false;
        if (f.outlet && r.outlet !== f.outlet) return false;
      }
      if (q && (r.vin + ' ' + r.nopol + ' ' + r.customer + ' ' + r.id + ' ' + r.model + ' ' + r.byName + ' ' + (r.cmp || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var el = $('#list');
    if (!l.length) { el.innerHTML = '<div class="empty">' + ic(mode === 'validasi' ? 'check' : 'inbox') + '<div>' + (mode === 'validasi' ? 'Tidak ada kasus yang menunggu validasi. 👍' : 'Tidak ada data.') + '</div></div>'; return; }
    el.innerHTML = isDesk() ? tableHtml(l) : cardsHtml(l);
    bindCaseClicks(el);
  };
  $('#fq').oninput = function () { f.q = this.value; draw(); };
  if ($('#fo')) $('#fo').onchange = function () { f.outlet = this.value; draw(); };
  if ($('#vchips')) $$('#vchips .chip').forEach(function (b) {
    b.onclick = function () { f.vstatus = b.dataset.s; $$('#vchips .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); };
  });
  if ($('#chips')) $$('#chips .chip').forEach(function (b) {
    b.onclick = function () { f.status = b.dataset.s; $$('#chips .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); };
  });
  draw();
}

/* ================= modal / sheet ================= */
var modalLock = false;
function closeModal() { $('#modalHost').innerHTML = ''; modalLock = false; }
function modal(inner, cls) {
  $('#modalHost').innerHTML = '<div class="overlay" id="ov"><div class="sheet ' + (cls || '') + '">' + inner + '</div></div>';
  $('#ov').addEventListener('mousedown', function (e) { if (e.target.id === 'ov' && !modalLock) closeModal(); });
}
function confirmBox(o) {
  return new Promise(function (resolve) {
    modal('<h3>' + esc(o.title) + '</h3><p class="muted" style="margin:8px 0 0">' + esc(o.body) + '</p>' +
      (o.typeWord ? '<label style="margin-top:14px">Ketik <b>' + esc(o.typeWord) + '</b> untuk melanjutkan</label><input type="text" id="cfw" autocapitalize="characters" autocomplete="off">' : '') +
      '<div class="stack" style="margin-top:16px"><button class="btn block ' + (o.danger ? 'bad' : '') + '" id="cfOk">' + esc(o.ok || 'Ya') + '</button><button class="btn sec block" id="cfNo">Batal</button></div>', 'narrow');
    var ok = $('#cfOk');
    if (o.typeWord) { ok.disabled = true; $('#cfw').oninput = function () { ok.disabled = this.value.trim().toUpperCase() !== o.typeWord; }; }
    ok.onclick = function () { closeModal(); resolve(true); };
    $('#cfNo').onclick = function () { closeModal(); resolve(false); };
  });
}

/* ================= akun ================= */
function showAccount() {
  modal('<div class="row" style="margin-bottom:16px"><div class="avatar" style="width:52px;height:52px;font-size:18px">' + esc(initials(S.user.nama)) + '</div><div><h3>' + esc(S.user.nama) + '</h3><div class="muted small">@' + esc(S.user.username) + ' · ' + esc(S.user.role) + ' · ' + (S.user.outlet === '*' ? 'Semua outlet' : esc(S.user.outlet)) + '</div></div></div>' +
    '<div class="stack"><button class="btn sec block" id="aPw">' + ic('key') + ' Ganti password</button>' +
    '<button class="btn sec block" id="aSync">' + ic('refresh') + ' Muat ulang data</button>' +
    '<button class="btn bad block" id="aOut">' + ic('out') + ' Keluar</button><button class="btn sec block" id="aX">Tutup</button></div>' +
    '<p class="small muted" style="text-align:center;margin:14px 0 0">Versi aplikasi ' + CONFIG.VERSION + (S.boot && S.boot.version ? ' · server ' + esc(S.boot.version) : '') + '</p>', 'narrow');
  $('#aPw').onclick = function () { showPwModal(false); };
  $('#aSync').onclick = function () { closeModal(); S.rev = null; syncNow().then(function () { toast('Data diperbarui.'); }); };
  $('#aOut').onclick = function () { closeModal(); doLogout(); };
  $('#aX').onclick = closeModal;
}

function pwField(id, ac, ph) {
  return '<div class="pwf"><input type="password" id="' + id + '" autocomplete="' + ac + '" placeholder="' + esc(ph || '') + '"><button type="button" class="eye" aria-label="Tampilkan password">' + ic('eye') + '</button></div>';
}
function showPwModal(force) {
  modal('<h3>' + (force ? 'Ganti password awal' : 'Ganti password') + '</h3>' + (force ? '<p class="muted">Demi keamanan, ganti password sementara Anda sebelum melanjutkan.</p>' : '') +
    '<div class="stack" style="margin-top:12px"><div><label>Password lama</label>' + pwField('pw0', 'current-password') + '</div>' +
    '<div><label>Password baru (min. 8 karakter)</label>' + pwField('pw1', 'new-password') + '</div>' +
    '<div><label>Ulangi password baru</label>' + pwField('pw2', 'new-password') + '</div></div>' +
    '<div id="perr" class="msg err hidden"></div><div class="stack" style="margin-top:14px"><button class="btn block" id="ps">Simpan</button>' + (force ? '' : '<button class="btn sec block" id="pc">Batal</button>') + '</div>', 'narrow');
  modalLock = !!force;
  if ($('#pc')) $('#pc').onclick = closeModal;
  $('#ps').onclick = function () {
    var er = $('#perr'), btn = this;
    er.classList.add('hidden');
    if ($('#pw1').value !== $('#pw2').value) { er.innerHTML = ic('warn') + '<span>Password baru tidak sama.</span>'; er.classList.remove('hidden'); return; }
    btn.disabled = true;
    api('changePassword', $('#pw0').value, $('#pw1').value).then(function () {
      closeModal(); toast('Password diganti.');
      if (window.PasswordCredential && navigator.credentials && store('vt_token')) {
        try { navigator.credentials.store(new PasswordCredential({ id: S.user.username, password: $('#pw1') ? $('#pw1').value : '', name: S.user.nama })).catch(function () {}); } catch (e) { /* */ }
      }
      if (S.boot) S.boot.mustChange = false;
    }).catch(function (e) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); btn.disabled = false; });
  };
}

/* ================= detail kasus ================= */
function kv(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + esc(v || '-') + '</dd>'; }

function filesBlock(items, files, phase) {
  var by = {};
  files.filter(function (f) { return (f.phase || 'before') === phase; }).forEach(function (f) { by[f.key] = f; });
  var shown = {}, h = '';
  items.forEach(function (a) {
    shown[a.key] = true;
    var f = by[a.key];
    if (f) h += fileLink(f, a.kind);
    else if (a.wajib) h += '<div class="miss">' + ic('warn') + '<span>' + esc(a.label) + ' — belum diunggah</span></div>';
  });
  Object.keys(by).forEach(function (k) { if (!shown[k]) h += fileLink(by[k], 'any'); });
  return h || '<div class="muted small">Belum ada file.</div>';
}
function fileLink(f, kind) {
  var k = kind && kind !== 'any' ? kind : (/\.(jpe?g|png|webp|heic)$/i.test(f.name) ? 'image' : /\.(mp4|mov|webm|3gp)$/i.test(f.name) ? 'video' : 'file');
  return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener"><span class="fi">' + ic(kindIcon(k)) + '</span><span class="tx">' + esc(f.label) + '<br><span class="small muted" style="font-weight:400">' + esc(f.name) + ' · ' + fmtSize(f.size) + '</span></span>' + ic('chev', 'sm') + '</a>';
}

function openCase(id) {
  modal('<div class="empty"><div class="spin" style="margin:0 auto 10px"></div>Memuat…</div>');
  apiRetry('getCase', id).then(function (d) { renderCase(d); }, function (e) {
    closeModal(); toast(errMsg(e));
  });
}

function renderCase(d) {
  var c = d.c, F = d.flags, A = S.boot.after;
  var steps = [];
  for (var i = 1; i <= 8; i++) if (c['Step' + i]) steps.push('<div style="display:flex;gap:8px;margin-bottom:4px"><b style="color:var(--blue);flex:none">' + i + '.</b><span>' + esc(c['Step' + i]) + '</span></div>');
  var h = '<div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3 class="mono" style="word-break:break-all">' + esc(c.VIN) + '</h3>' +
    '<div class="muted small" style="margin-top:3px">' + esc(c.CaseID) + ' · ' + esc(fmtDT(c.Timestamp)) + '</div></div><div style="text-align:right">' + pill(c.Status) + '<div style="margin-top:4px">' + afterPill(c.AfterStatus) + '</div></div></div>';
  if (c.DriveDeletedAt) h += '<div class="msg warn">' + ic('trash') + '<span>File Drive kasus ini sudah dihapus permanen oleh ' + esc(c.DriveDeletedBy) + ' (' + esc(fmtDT(c.DriveDeletedAt)) + '). Data di sheet tetap tersimpan.</span></div>';
  if (c.ValidationNote) h += '<div class="msg ' + (c.Status === T.REVISI ? 'err' : 'ok') + '">' + ic(c.Status === T.REVISI ? 'undo' : 'check') + '<span><b>Catatan foreman' + (c.ValidatedBy ? ' (' + esc(c.ValidatedBy) + ')' : '') + ':</b> ' + esc(c.ValidationNote) + '</span></div>';
  if (c.VinfastAt) h += '<div class="msg info">' + ic('send') + '<span><b>Diajukan ke VinFast</b> oleh ' + esc(c.VinfastBy) + ' · ' + esc(fmtDT(c.VinfastAt)) + (c.VinfastRef ? ' · No. <b>' + esc(c.VinfastRef) + '</b>' : '') +
    (c.ApprovedAt ? '<br><b>Approved VinFast</b> ditandai ' + esc(c.ApprovedBy) + ' · ' + esc(fmtDT(c.ApprovedAt)) : (c.Status === T.SUBMITTED ? '<br>Menunggu approval VinFast.' : '')) + '</span></div>';
  if (F.viewOnly) h += '<div class="msg info">' + ic('eye') + '<span>Akses Partman: lihat saja. Kode part ada di bagian Dokumentasi After Penggantian.</span></div>';
  if (c.Status === T.DONE && c.AfterStatus === A.WAIT && F.canAfter) h += '<div class="msg info">' + ic('box') + '<span>Kasus sudah divalidasi. Silakan upload <b>Dokumentasi After Penggantian</b>.</span></div>';
  h += '<div class="deskgrid"><div>';
  var isCmp = c.CaseType === 'Campaign';
  if (c.Status === T.DRAFT && c.AssignedBy) h += '<div class="msg info">' + ic('users') + '<span>Ditugaskan oleh foreman <b>' + esc(c.AssignedBy) + '</b> ke ' + esc(c.InputByName) + '.</span></div>';
  if (c.Status === T.DRAFT && c.InputBy !== S.user.username) h += '<div class="msg warn">' + ic('edit') + '<span>Draft masih dikerjakan ' + esc(c.InputByName) + ' · terakhir diubah ' + esc(ago(c.UpdatedAt)) + '.</span></div>';
  if (isCmp) {
    var cd = []; try { cd = JSON.parse(c.CampaignData || '[]'); } catch (x) { /* */ }
    h += '<div class="sec-t">' + ic('box') + 'Campaign</div><dl class="kv">' + kv('Campaign', c.CampaignName) + cd.map(function (x) { return kv(x.label, x.value); }).join('') + '</dl>';
    h += '<div class="sec-t">' + ic('car') + 'Kendaraan</div><dl class="kv">' + kv('Workshop', c.Outlet) + kv('Nopol', c.Nopol) + kv('Model', c.Model) + kv('Customer', c.Customer) + kv('Diinput', c.InputByName) + '</dl>';
  } else {
  h += '<div class="sec-t">' + ic('car') + 'Kendaraan</div><dl class="kv">' + kv('Workshop', c.Outlet) + kv('Nopol', c.Nopol) + kv('Model', c.Model) + kv('ODO', c.ODO) + kv('Customer', c.Customer) + kv('Failure date', fmtDate(c.FailureDate)) + kv('Jenis kasus', c.CaseType) + kv('Diinput', c.InputByName) + '</dl>';
  h += '<div class="sec-t">' + ic('tool') + 'Investigasi</div><dl class="kv">' + kv('Feedback', c.Feedback) + '<dt>Action taken</dt><dd>' + (steps.join('') || '-') + '</dd>' + kv('Rootcause', c.Rootcause) + kv('Corrective', c.Corrective) + kv('Remarks', c.Remarks) + '</dl>';
  }
  h += '</div><div>';
  h += '<div class="sec-t">' + ic('clip') + (isCmp ? 'Dokumentasi Campaign' : 'Mandatory Data VTAG') + '</div><div class="files">' + filesBlock(d.before, d.files, 'before') + '</div>';
  if (!isCmp && (c.Status === T.DONE || c.AfterStatus)) {
    h += '<div class="sec-t">' + ic('box') + 'Dokumentasi After Penggantian</div>';
    if (c.AfterPartLamaNo || c.AfterPartBaruNo || c.AfterNote) h += '<dl class="kv" style="margin-bottom:8px">' + kv('Kode part lama', c.AfterPartLamaNo) + kv('Kode part baru', c.AfterPartBaruNo) + (c.AfterNote ? kv('Catatan', c.AfterNote) : '') + '</dl>';
    h += '<div class="files">' + filesBlock(d.after, d.files, 'after') + '</div>';
    if (c.AfterBy) h += '<div class="small muted">Diupload oleh ' + esc(c.AfterBy) + ' · ' + esc(fmtDT(c.AfterAt)) + '</div>';
  }
  if (c.FolderUrl) h += '<a class="btn sec block" style="margin-top:10px" href="' + esc(c.FolderUrl) + '" target="_blank" rel="noopener">' + ic('folder') + ' Buka folder Google Drive</a>';
  h += '</div></div>';
  if (F.canValidate) {
    h += '<div class="sec-t">' + ic('shield') + 'Validasi foreman · langkah 1</div>' +
      '<div class="small muted" style="margin:-4px 0 8px">Cek data & lampiran. Jika benar, ajukan ke sistem VinFast lalu tandai di sini.</div>' +
      '<label>No. VTAG / tiket VinFast <span class="opt">(opsional)</span></label><input type="text" id="vref" placeholder="Mis. VTAG-2026-001" style="margin-bottom:10px">' +
      '<textarea id="vnote" placeholder="Catatan (wajib jika minta revisi). Mis. foto ODO buram…"></textarea>' +
      '<div id="verr" class="msg err hidden"></div><div class="stack" style="margin-top:10px"><button class="btn block" id="bOk">' + ic('send') + ' Data benar & sudah diajukan ke VinFast</button><button class="btn bad block" id="bRev">' + ic('undo') + ' Minta revisi ke mekanik</button></div>';
  }
  if (F.canApprove) {
    h += '<div class="sec-t">' + ic('shield') + 'Approval VinFast · langkah 2</div>' +
      '<div class="small muted" style="margin:-4px 0 8px">Tandai setelah kasus di-approve di sistem VinFast. Status berubah jadi <b>Sudah Terinput VTAG</b> & mekanik diminta upload dokumentasi after.</div>' +
      '<label>No. VTAG / tiket VinFast <span class="opt">(opsional)</span></label><input type="text" id="vref" value="' + esc(c.VinfastRef || '') + '" style="margin-bottom:10px">' +
      '<textarea id="vnote" placeholder="Catatan (wajib jika ditolak VinFast)"></textarea>' +
      '<div id="verr" class="msg err hidden"></div><div class="stack" style="margin-top:10px"><button class="btn ok block" id="bOk">' + ic('check') + ' Sudah di-approve VinFast → Sudah Terinput VTAG</button><button class="btn bad block" id="bRev">' + ic('undo') + ' Ditolak VinFast → kembalikan ke mekanik</button></div>';
  }
  h += '<div class="stack" style="margin-top:16px">';
  if (F.canAfter) h += '<button class="btn or block" id="bAfter">' + ic('box') + (c.AfterStatus === A.DONE ? ' Perbarui Dokumentasi After' : ' Upload Dokumentasi After') + '</button>';
  if (F.canEdit) h += '<button class="btn block" id="bEdit">' + ic('edit') + (F.isAdmin && c.InputBy !== S.user.username ? ' Edit data (Admin)' : c.Status === T.REVISI ? ' Revisi data' : ' Edit / lengkapi') + '</button>';
  if (F.canPrint) h += '<button class="btn sec block" id="bPrint">' + ic('printer') + ' Cetak form (PDF / Excel)</button>';
  if (F.canPurge) h += '<button class="btn sec block" id="bPurge" style="color:var(--bad)">' + ic('trash') + ' Hapus file Drive (permanen)</button>';
  if (F.canDelete) h += '<button class="btn bad block" id="bDel">' + ic('trash') + (c.Status === T.DRAFT && !F.isAdmin ? ' Hapus draft' : ' Hapus kasus') + '</button>';
  h += '<button class="btn sec block" id="bClose">Tutup</button></div>';
  modal(h);
  $('#bClose').onclick = closeModal;
  if (F.canEdit) $('#bEdit').onclick = function () {
    closeModal();
    var loc = S.localDrafts.filter(function (x) { return x.caseId === c.CaseID && x.id.indexOf('new:') === 0 && x.state === 'editing'; })[0];
    if (loc) { S.form = loc; S.tab = 'input'; renderNav(); renderView(); window.scrollTo(0, 0); return; }
    openEditForm(d);
  };
  if (F.canAfter) $('#bAfter').onclick = function () { closeModal(); openAfterForm(c.CaseID, d); };
  if (F.canPrint) $('#bPrint').onclick = function () { doPrint(c.CaseID, c.VIN); };
  if (F.canPurge) $('#bPurge').onclick = function () {
    confirmBox({ title: 'Hapus file Drive permanen?', body: 'Semua foto, video & log kasus ' + c.VIN + ' di Google Drive akan dihapus PERMANEN (tidak masuk sampah) untuk menghemat ruang. Data kasus di sheet tetap tersimpan.', ok: 'Hapus file permanen', danger: true, typeWord: 'HAPUS' })
      .then(function (yes) {
        if (!yes) return openCase(c.CaseID);
        busyModal('Menghapus file Drive…');
        api('purgeDrive', c.CaseID).then(function () { closeModal(); toast('File Drive dihapus permanen.'); S.rev = null; syncNow(); openCase(c.CaseID); }, function (e) { closeModal(); toast(errMsg(e)); });
      });
  };
  if (F.canDelete) $('#bDel').onclick = function () {
    confirmBox({ title: 'Hapus kasus ini?', body: 'Kasus ' + c.CaseID + ' (' + c.VIN + ') akan dihapus dari sheet beserta semua file Drive-nya secara permanen. Tidak bisa dibatalkan.', ok: 'Hapus kasus', danger: true, typeWord: 'HAPUS' })
      .then(function (yes) {
        if (!yes) return openCase(c.CaseID);
        busyModal('Menghapus kasus…');
        api('deleteCase', c.CaseID).then(function () {
          closeModal(); toast('Kasus dihapus.'); S.rev = null; syncNow();
          Drafts.get('edit:' + c.CaseID).then(function (ld) { if (ld) Drafts.remove(ld); });
          Drafts.get('new:' + S.user.username).then(function (ld) { if (ld && ld.caseId === c.CaseID) Drafts.remove(ld); });
        }, function (e) { closeModal(); toast(errMsg(e)); });
      });
  };
  if (F.canValidate || F.canApprove) {
    var goV = function (decision) {
      var note = $('#vnote').value, er = $('#verr'), ref = $('#vref') ? $('#vref').value : '';
      er.classList.add('hidden');
      if (decision === 'revisi' && !note.trim()) { er.innerHTML = ic('warn') + '<span>Isi catatan revisi untuk mekanik.</span>'; er.classList.remove('hidden'); $('#vnote').focus(); return; }
      $('#bOk').disabled = $('#bRev').disabled = true;
      // server lama (< 2.1) belum kenal status "Diajukan ke VinFast": pakai alur lama
      if (decision === 'submit' && S.boot && S.boot.version && S.boot.version < '2.1') decision = 'valid';
      api('validateCase', c.CaseID, decision, note, ref).then(function () {
        if (decision === 'valid') decision = 'approve';
        closeModal();
        toast(decision === 'submit' ? '➜ Ditandai: Diajukan ke VinFast' : decision === 'approve' ? '✔ Sudah Terinput VTAG' : '↩ Dikembalikan ke mekanik untuk revisi');
        markLocal(c.CaseID, decision === 'submit' ? { status: T.SUBMITTED } : decision === 'approve' ? { status: T.DONE, after: d.after.length ? A.WAIT : '' } : { status: T.REVISI });
        S.rev = null; syncNow();
      }, function (e) {
        er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden');
        $('#bOk').disabled = $('#bRev').disabled = false;
      });
    };
    $('#bOk').onclick = function () { goV(F.canApprove ? 'approve' : 'submit'); };
    $('#bRev').onclick = function () { goV('revisi'); };
  }
}

/** Perbarui tampilan langsung (sebelum sinkron server selesai). */
function markLocal(id, patch) {
  rows().forEach(function (r) { if (r.id === id) Object.keys(patch).forEach(function (k) { r[k] = patch[k]; }); });
  renderNav(); if (S.tab !== 'input') renderView();
}

function busyModal(text) {
  modal('<div class="empty"><div class="spin" style="margin:0 auto 12px"></div>' + esc(text) + '</div>', 'narrow');
  modalLock = true;
}

/* ================= cetak ================= */
function dlFile(name, mime, b64) {
  try {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u], { type: mime }));
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 5000);
    toast('Mengunduh ' + name);
  } catch (e) { toast('Unduhan gagal. Gunakan "Buka di Drive".'); }
}
function doPrint(id, vin) {
  modal('<h3>Menyiapkan form…</h3><div class="muted small" style="margin:6px 0 14px">Mengisi template dan membuat PDF & Excel. Biasanya 10–30 detik.</div><div class="spin" style="margin:0 auto"></div>', 'narrow');
  modalLock = true;
  api('printCase', id).then(function (r) {
    modalLock = false;
    modal('<h3>Form siap 🎉</h3><div class="muted small" style="margin:4px 0 12px;word-break:break-all">' + esc(vin) + '</div>' +
      r.files.map(function (f, i) {
        var isPdf = /pdf$/.test(f.mime);
        return '<div class="att have"><div class="ai">' + ic('file', 'lg') + '</div><div class="t"><b>' + (isPdf ? 'PDF' : 'Excel') + '</b><div class="fn">' + esc(f.name) + '</div></div>' +
          '<div class="acts"><button class="pick" data-dl="' + i + '" style="background:var(--orange);color:#fff;border:0">' + ic('download', 'sm') + 'Unduh</button>' +
          (f.url ? '<a class="small" href="' + esc(f.url) + '" target="_blank" rel="noopener">Buka di Drive</a>' : '') + '</div></div>';
      }).join('') + '<div class="small muted">File juga tersimpan di folder Drive kasus.</div><button class="btn sec block" id="pcl" style="margin-top:14px">Tutup</button>', 'narrow');
    $$('[data-dl]').forEach(function (b) { b.onclick = function () { var f = r.files[+b.dataset.dl]; dlFile(f.name, f.mime, f.b64); }; });
    $('#pcl').onclick = closeModal;
  }, function (e) {
    modalLock = false;
    modal('<h3>Gagal mencetak</h3><div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div><button class="btn sec block" id="pcl">Tutup</button>', 'narrow');
    $('#pcl').onclick = closeModal;
  });
}

/* ================= form: draft ================= */
function setting(key) { return (S.boot.settings || []).filter(function (i) { return i.key === key; })[0] || null; }
function opt(key, def) { var s = setting(key); return s ? !!s.tampil : def; }
function itemsFor(jenis, caseType, model) {
  var mk = String(model || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (S.boot.settings || []).filter(function (i) {
    if (i.jenis !== jenis || !i.tampil) return false;
    if (i.kasus && i.kasus.toLowerCase() !== 'semua' && i.kasus.toLowerCase() !== String(caseType || '').toLowerCase()) return false;
    if (i.model && mk.indexOf(String(i.model).toUpperCase().replace(/[^A-Z0-9]/g, '')) !== 0) return false;
    return true;
  });
}
function fieldCfg(key) { var s = setting(key); return s && s.jenis === 'field' ? s : { key: key, label: key, tampil: true, wajib: false }; }

function emptyCase() {
  var u = S.user;
  return { outlet: u.outlet === '*' ? '' : u.outlet, nopol: '', vin: '', customer: '', failureDate: '', odo: '', model: '', caseType: '', feedback: '', steps: ['', '', '', '', '', '', '', ''], rootcause: '', corrective: '', remarks: '', campaignId: '', cdata: {} };
}
function newDraft(id, kind) {
  return { id: id, user: S.user.username, kind: kind, caseId: null, editOf: null, v: emptyCase(), after: { partLamaNo: '', partBaruNo: '', note: '' }, files: {}, existing: {}, state: 'editing', createdAt: Date.now() };
}
function draftHasContent(d) {
  var v = d.v || {};
  return !!(v.vin || v.nopol || v.customer || v.feedback || Object.keys(d.files || {}).length);
}

function openNewForm() {
  var id = 'new:' + S.user.username;
  return Drafts.get(id).then(function (d) {
    if (d && d.state === 'sending') { S.form = d; return; }
    S.form = d || newDraft(id, 'case');
    S.form.restored = !!(d && draftHasContent(d));
  });
}
function openEditForm(cd) {
  var c = cd.c, id = 'edit:' + c.CaseID;
  Drafts.get(id).then(function (d) {
    if (!d) {
      d = newDraft(id, 'case'); d.caseId = c.CaseID; d.editOf = c.CaseID; d.caseStatus = c.Status;
      var steps = []; for (var i = 1; i <= 8; i++) steps.push(c['Step' + i] || '');
      d.v = { outlet: c.Outlet, nopol: c.Nopol, vin: c.VIN, customer: c.Customer, failureDate: c.FailureDate, odo: c.ODO, model: c.Model, caseType: c.CaseType, feedback: c.Feedback, steps: steps, rootcause: c.Rootcause, corrective: c.Corrective, remarks: c.Remarks, campaignId: c.CampaignID || '', cdata: {} };
    }
    d.chosen = true;
    if (c.CaseType === 'Campaign') {
      var cdl = []; try { cdl = JSON.parse(c.CampaignData || '[]'); } catch (x) { /* */ }
      if (!Object.keys(d.v.cdata || {}).length) { d.v.cdata = {}; cdl.forEach(function (x) { d.v.cdata[x.id] = x.value; }); }
      d.cmpDef = { id: c.CampaignID, nama: c.CampaignName, fields: cdl.map(function (x) { return { id: x.id, label: x.label, type: 'text', wajib: false }; }),
        lampiran: cd.before.map(function (b) { return { id: String(b.key).split('_').pop(), label: b.label, kind: b.kind, wajib: b.wajib, hint: b.hint }; }) };
    }
    d.existing = {};
    cd.files.filter(function (f) { return f.phase !== 'after'; }).forEach(function (f) { d.existing[f.key] = f; });
    d.note = c.Status === T.REVISI ? c.ValidationNote : '';
    S.form = d; S.tab = 'input'; renderNav(); renderView(); window.scrollTo(0, 0);
  });
}
function openAfterForm(caseId, cd) {
  var p = cd ? Promise.resolve(cd) : apiRetry('getCase', caseId);
  busyModal('Menyiapkan form…');
  p.then(function (cd2) {
    closeModal();
    if (!cd2.flags.canAfter) { toast('Dokumentasi after belum bisa diupload untuk kasus ini.'); return; }
    var c = cd2.c, id = 'after:' + c.CaseID;
    return Drafts.get(id).then(function (d) {
      if (!d) {
        d = newDraft(id, 'after'); d.caseId = c.CaseID;
        d.after = { partLamaNo: c.AfterPartLamaNo || '', partBaruNo: c.AfterPartBaruNo || '', note: c.AfterNote || '' };
      }
      d.v = { vin: c.VIN, nopol: c.Nopol, model: c.Model, caseType: c.CaseType, outlet: c.Outlet };
      d.existing = {};
      cd2.files.filter(function (f) { return f.phase === 'after'; }).forEach(function (f) { d.existing[f.key] = f; });
      S.form = d; S.tab = 'input'; renderNav(); renderView(); window.scrollTo(0, 0);
    });
  }).catch(function (e) { closeModal(); toast(errMsg(e)); });
}

var saveFormSoon = debounce(function () { if (S.form && S.form.state === 'editing') { Drafts.save(S.form).then(function () { var s = $('#saveState'); if (s) s.innerHTML = ic('check', 'xs') + ' Draft tersimpan otomatis di HP'; }); } }, 600);
function flushForm() { if (S.form && $('#frm')) { collect(); if (S.form.state === 'editing') { Drafts.save(S.form); pushServerDraft(S.form, true); } } }

/* ================= form: tampilan ================= */
function renderForm(m) {
  if (!S.form) { m.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>'; openNewForm().then(function () { if (S.tab === 'input') renderForm($('#main')); }); return; }
  var F = S.form;
  if (F.state === 'sending' || (F.state === 'error' && Sender.active[F.id])) return renderSendingView(m, F);
  if (F.kind === 'after') return renderAfterForm(m, F);
  if (!F.editOf && !F.chosen && !draftHasContent(F) && campaignsActive().length) return renderChooser(m, F);
  if (F.v.caseType === 'Campaign') return renderCampaignForm(m, F);
  var v = F.v, b = S.boot, lockOutlet = !isAdmin() && S.user.outlet !== '*';
  var adminEdit = F.editOf && isAdmin() && F.caseStatus && F.caseStatus !== T.DRAFT && F.caseStatus !== T.REVISI;
  var h = '<div class="form-wrap"><form id="frm" autocomplete="off" novalidate>';
  h += '<div class="hero" style="padding:14px 18px"><h1>' + (F.editOf ? (adminEdit ? 'Edit data (Admin)' : 'Revisi / lengkapi kasus') : 'Kasus baru') + '</h1><p>' + (F.editOf ? esc(F.editOf) + ' · ' : '') + 'Workshop Investigation Form</p></div>';
  if (F.restored) h += '<div class="msg info">' + ic('refresh') + '<span>Melanjutkan draft yang tersimpan. <button type="button" class="btn sm sec" id="fReset" style="margin-left:6px">Mulai baru</button></span></div>';
  if (F.note) h += '<div class="msg err">' + ic('undo') + '<span><b>Catatan revisi foreman:</b> ' + esc(F.note) + '</span></div>';
  if (adminEdit) h += '<div class="msg warn">' + ic('shield') + '<span>Mode admin: perubahan disimpan tanpa mengubah status kasus (' + esc(F.caseStatus) + ').</span></div>';
  if (F.state === 'error' && F.err) h += '<div class="msg err">' + ic('warn') + '<span>Pengiriman sebelumnya gagal: ' + esc(F.err) + '</span></div>';
  h += '<div class="savebar" id="saveState">' + ic('check', 'xs') + ' Draft tersimpan otomatis di HP</div>';

  h += '<div class="card"><h2><span class="hic num">1</span>Data kendaraan</h2><div class="stack">' +
    '<div><label>Dealer / Workshop Name <span class="req">*</span></label>' +
    (lockOutlet ? '<input type="text" id="f_outlet" value="' + esc(v.outlet) + '" readonly style="background:var(--gray-bg)">' :
      '<select id="f_outlet"><option value="">Pilih outlet…</option>' + b.outlets.map(function (o) { return '<option' + (v.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>') + '</div>' +
    '<div><label>VIN <span class="req">*</span></label><input type="text" id="f_vin" value="' + esc(v.vin) + '" placeholder="17 karakter" maxlength="17" autocapitalize="characters" autocorrect="off" spellcheck="false" class="mono"><div class="small muted" id="vinc" style="margin-top:4px"></div></div>' +
    '<div class="two"><div><label>Nopol <span class="req">*</span></label><input type="text" id="f_nopol" value="' + esc(v.nopol) + '" placeholder="B 1234 XYZ" autocapitalize="characters"></div>' +
    '<div><label>Model <span class="req">*</span></label><input type="text" id="f_model" list="dlModel" value="' + esc(v.model) + '" placeholder="VFe34"><datalist id="dlModel">' + b.models.map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist></div></div>' +
    '<div class="two"><div><label>ODO (km) <span class="req">*</span></label><input type="text" id="f_odo" value="' + esc(v.odo) + '" inputmode="numeric" placeholder="37.540"></div>' +
    '<div><label>Failure Date <span class="req">*</span></label><input type="date" id="f_date" value="' + esc(v.failureDate) + '"></div></div>' +
    '<div><label>Customer Name <span class="req">*</span></label><input type="text" id="f_customer" value="' + esc(v.customer) + '"></div>' +
    '<div><label>Jenis kasus <span class="req">*</span></label><div class="typepick" id="f_type">' +
    [['Electrical', 'zap'], ['Mechanical', 'tool']].map(function (t) { return '<label><input type="radio" name="ctype" value="' + t[0] + '"' + (v.caseType === t[0] ? ' checked' : '') + '><span class="tile"><span class="tc">' + ic(t[1]) + '</span>' + t[0] + '</span></label>'; }).join('') + '</div></div>' +
    '</div></div>';

  var fd = function (key) { return fieldCfg(key); };
  var lbl = function (cfg) { return esc(cfg.label) + (cfg.wajib ? ' <span class="req">*</span>' : ' <span class="opt">(opsional)</span>'); };
  var detail = '';
  if (fd('feedback').tampil) detail += '<div><label>' + lbl(fd('feedback')) + '</label><textarea id="f_feedback" placeholder="Keluhan customer / gejala kerusakan">' + esc(v.feedback) + '</textarea></div>';
  if (fd('steps').tampil) detail += '<div><label>' + lbl(fd('steps')) + '</label><div id="steps"></div><button type="button" class="btn sec sm" id="addStep">' + ic('plus', 'sm') + ' Tambah step</button></div>';
  if (fd('rootcause').tampil) detail += '<div><label>' + lbl(fd('rootcause')) + '</label><textarea id="f_root">' + esc(v.rootcause) + '</textarea></div>';
  if (fd('corrective').tampil) detail += '<div><label>' + lbl(fd('corrective')) + '</label><textarea id="f_corr">' + esc(v.corrective) + '</textarea></div>';
  if (fd('remarks').tampil) detail += '<div><label>' + lbl(fd('remarks')) + '</label><textarea id="f_rem" style="min-height:64px">' + esc(v.remarks) + '</textarea></div>';
  if (detail) h += '<div class="card"><h2><span class="hic num">2</span>Detail kasus</h2><div class="stack">' + detail + '</div></div>';

  h += '<div class="card"><h2><span class="hic num or">3</span>Lampiran untuk VTAG</h2><div class="small muted" style="margin:-4px 0 10px">' + (opt('watermark', true) ? '🕒 Foto & video otomatis diberi <b>watermark tanggal-jam, VIN & Nopol</b> (isi VIN & Nopol dulu sebelum foto). ' : '') + 'Foto dikompres tanpa buram. File tersimpan di HP sampai terkirim.</div>' +
    '<div class="small" id="attc" style="font-weight:700"></div><div class="prog"><i id="attp"></i></div><div id="atts"></div></div>';
  h += '<div id="ferr" class="msg err hidden"></div><div class="sendbar"><button class="btn or block" type="submit" id="fSend">' + ic('send') + (adminEdit ? ' Simpan perubahan' : ' Kirim ke Foreman') + '</button></div>' +
    (!adminEdit && isTouch() ? '<button type="button" class="btn sec block" id="fLater" style="margin-top:10px">' + ic('upload') + ' Simpan dulu, lanjut upload file dari laptop</button>' +
      '<div class="small muted" style="margin:6px 4px 0">Untuk SWBOOM, DTC & TBOX log yang ada di laptop: data & foto dikirim sekarang sebagai <b>Draft</b>, lalu buka <b>jokopriyanto-cmd.github.io</b> di laptop → login → lengkapi file → Kirim ke Foreman.</div>' : '') +
    '<button type="button" class="btn sec block" id="fCancel" style="margin-top:10px">Tutup form (draft tetap tersimpan)</button>' +
    (F.editOf || !campaignsActive().length ? '' : '<button type="button" class="btn ghost block" id="fSwitch" style="margin-top:4px">Ganti jenis input (Campaign)</button>') +
    (F.editOf ? '' : '<button type="button" class="btn ghost block" id="fDiscard" style="margin-top:4px;color:var(--bad)">Hapus draft ini</button>') + '</form></div>';
  m.innerHTML = h;
  if ($('#steps')) drawSteps();
  drawAtts(); vinHint();
  bindFormEvents();
}

function bindFormEvents() {
  var F = S.form;
  $('#frm').addEventListener('input', function (e) {
    if (e.target.id === 'f_vin') { var p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); try { e.target.setSelectionRange(p, p); } catch (x) { /* */ } vinHint(); }
    if (e.target.id === 'f_nopol') { var q = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); try { e.target.setSelectionRange(q, q); } catch (x) { /* */ } }
    e.target.classList.remove('bad-input');
    var fe = e.target.parentNode && e.target.parentNode.querySelector('.ferr'); if (fe) fe.remove();
    collect();
    var s = $('#saveState'); if (s) s.innerHTML = ic('clock', 'xs') + ' Menyimpan…';
    saveFormSoon(); serverDraftSoon();
  });
  if ($('#fSwitch')) $('#fSwitch').onclick = function () { collect(); F.chosen = false; Drafts.save(F); renderChooser($('#main'), F); };
  $$('input[name=ctype]').forEach(function (r) { r.onchange = function () { collect(); drawAtts(); saveFormSoon(); }; });
  if ($('#f_model')) $('#f_model').addEventListener('change', function () { collect(); drawAtts(); });
  if ($('#f_model')) $('#f_model').addEventListener('blur', function () { collect(); drawAtts(); });
  if ($('#addStep')) $('#addStep').onclick = function () { collect(); F.stepsShown = Math.min(8, (F.stepsShown || 3) + 1); drawSteps(); };
  $('#fCancel').onclick = function () { flushForm(); S.form = null; go('home'); toast('Draft tersimpan. Lanjutkan kapan saja dari menu Input.'); };
  if ($('#fDiscard')) $('#fDiscard').onclick = function () {
    confirmBox({ title: 'Hapus draft?', body: 'Semua isian & file yang sudah dipilih di draft ini akan dihapus dari HP.', ok: 'Hapus draft', danger: true }).then(function (y) {
      if (!y) return;
      var sid = !F.editOf && F.caseId;
      Drafts.remove(F).then(function () { S.form = null; renderView(); toast('Draft dihapus.'); });
      if (sid) api('deleteCase', sid).then(function () { S.rev = null; syncNow(); }).catch(function () {});
    });
  };
  if ($('#fReset')) $('#fReset').onclick = function () {
    confirmBox({ title: 'Mulai form baru?', body: 'Draft yang tersimpan akan dihapus.', ok: 'Mulai baru', danger: true }).then(function (y) {
      if (!y) return;
      var sid = !F.editOf && F.caseId;
      Drafts.remove(F).then(function () { S.form = newDraft(F.id, 'case'); renderView(); });
      if (sid) api('deleteCase', sid).catch(function () {});
    });
  };
  $('#frm').onsubmit = function (ev) { submitForm(ev, false); };
  if ($('#fLater')) $('#fLater').onclick = function () { submitForm(null, true); };
}

function vinHint() {
  var el = $('#vinc'); if (!el) return;
  var n = $('#f_vin').value.length;
  el.innerHTML = n === 0 ? '' : (n === 17 ? '<span style="color:var(--ok)">✓ 17 karakter</span>' : n + '/17 karakter');
}
function drawSteps() {
  var F = S.form, v = F.v;
  var last = 0; v.steps.forEach(function (s, i) { if (s) last = i + 1; });
  var shown = Math.max(F.stepsShown || 3, last, 1);
  F.stepsShown = shown;
  $('#steps').innerHTML = v.steps.slice(0, shown).map(function (s, i) {
    return '<div class="stp"><span class="no">' + (i + 1) + '</span><input type="text" data-step="' + i + '" value="' + esc(s) + '" placeholder="' + (i === 0 ? 'Mis. Check fuse & relay IGN (Good)' : 'Step ' + (i + 1)) + '"></div>';
  }).join('');
  $('#addStep').classList.toggle('hidden', shown >= 8);
}
function collect() {
  var F = S.form; if (!F) return;
  if (F.kind === 'after') {
    if (!$('#a_lama')) return;
    F.after.partLamaNo = $('#a_lama').value; F.after.partBaruNo = $('#a_baru').value; F.after.note = $('#a_note').value;
    return;
  }
  var v = F.v; if (!$('#f_vin')) return;
  var val = function (id, cur) { var e = $('#' + id); return e ? e.value : cur; };
  v.outlet = val('f_outlet', v.outlet); v.nopol = val('f_nopol', v.nopol); v.vin = val('f_vin', v.vin); v.odo = val('f_odo', v.odo); v.model = val('f_model', v.model);
  v.failureDate = val('f_date', v.failureDate); v.customer = val('f_customer', v.customer); v.feedback = val('f_feedback', v.feedback);
  v.rootcause = val('f_root', v.rootcause); v.corrective = val('f_corr', v.corrective); v.remarks = val('f_rem', v.remarks);
  var r = document.querySelector('input[name=ctype]:checked'); if (v.caseType !== 'Campaign') v.caseType = r ? r.value : v.caseType;
  $$('[data-step]').forEach(function (i) { v.steps[+i.dataset.step] = i.value; });
  if (v.caseType === 'Campaign') { v.cdata = v.cdata || {}; $$('[data-cf]').forEach(function (i) { v.cdata[i.dataset.cf] = i.value; }); }
}

function formItems() {
  var F = S.form;
  if (F.kind === 'after') return itemsFor('after', F.v.caseType, F.v.model);
  if (F.v.caseType === 'Campaign') return cmpItems(cmpDef(F));
  return F.v.caseType ? itemsFor('lampiran', F.v.caseType, F.v.model) : [];
}

function drawAtts() {
  var F = S.form, el = $('#atts');
  if (!el) return;
  if (F.kind !== 'after' && !F.v.caseType) {
    el.innerHTML = '<div class="empty" style="padding:16px">' + ic('clip') + '<div>Pilih jenis kasus (Electrical / Mechanical) dulu untuk menampilkan daftar lampiran.</div></div>';
    $('#attc').textContent = ''; $('#attp').style.width = '0'; return;
  }
  var list = formItems(), group = '', req = 0, ok = 0;
  el.innerHTML = list.map(function (a) {
    var head = a.grup !== group ? '<div class="grp">' + esc(a.grup) + '</div>' : ''; group = a.grup;
    var nf = F.files[a.key], ex = F.existing && F.existing[a.key];
    var pk = F.id + '|' + a.key, pr = S.proc[pk];
    var have = !!(nf || ex);
    if (a.wajib) { req++; if (have) ok++; }
    var status, cls = have ? 'have' : '';
    if (pr) { cls = 'busy'; status = '<div class="fn">' + esc(pr.label) + '</div><div class="miniprog"><i style="width:' + Math.round((pr.pct || 0) * 100) + '%"></i></div>'; }
    else if (nf) status = '<div class="fn ok">' + ic('check', 'xs') + ' ' + esc(nf.name) + ' · ' + fmtSize(nf.size) + (nf.origSize && nf.origSize > nf.size * 1.05 ? ' (dari ' + fmtSize(nf.origSize) + ')' : '') + '</div>' + (nf.note ? '<div class="fn">' + esc(nf.note) + '</div>' : '');
    else if (ex) status = '<div class="fn ok">' + ic('check', 'xs') + ' Sudah terunggah · ' + esc(ex.name) + '</div>';
    else status = '<div class="fn">' + (a.wajib ? 'Wajib diisi' : 'Opsional') + '</div>';
    var thumb = nf && nf.thumb ? '<img alt="" src="' + nf.thumb + '">' : ic(have ? 'check' : kindIcon(a.kind), 'lg');
    var picks = pickButtons(a);
    return head + '<div class="att ' + cls + '" id="att_' + a.key + '"><div class="ai">' + thumb + '</div><div class="t"><b>' + esc(a.label) + ' ' + (a.wajib ? '<span class="tag w">Wajib</span>' : '<span class="tag">Opsional</span>') + '</b>' +
      (a.hint ? '<div class="small muted">' + esc(a.hint) + '</div>' : '') + status + '</div><div class="acts">' +
      (pr ? (pr.cancel ? '<button type="button" class="xbtn" data-skip="' + a.key + '">Lewati</button>' : '') :
        picks +
        (nf ? '<button type="button" class="xbtn" data-rm="' + a.key + '">Hapus</button>' : '')) + '</div></div>';
  }).join('') || '<div class="muted small">Tidak ada lampiran untuk jenis kasus ini.</div>';
  $('#attc').textContent = ok + ' dari ' + req + ' lampiran wajib terpenuhi';
  $('#attp').style.width = (req ? ok / req * 100 : 100) + '%';
  $$('input[type=file]', el).forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; inp.value = ''; if (f) pickFile(inp.dataset.key, f, inp.dataset.src); }; });
  $$('[data-rm]', el).forEach(function (b) {
    b.onclick = function () {
      var k = b.dataset.rm, f = F.files[k];
      if (f) Blobs.del(f.blobId);
      delete F.files[k]; Drafts.save(F); drawAtts();
    };
  });
  $$('[data-skip]', el).forEach(function (b) { b.onclick = function () { var pr = S.proc[F.id + '|' + b.dataset.skip]; if (pr && pr.cancel) pr.cancel(); }; });
}

/** Tombol ambil file: Kamera (langsung) + Galeri/File. Di laptop cukup "Pilih file". */
function isTouch() { return !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window; }
function pickBtn(key, icon, text, accept, capture, primary) {
  return '<label class="pick ' + (primary ? '' : 'alt') + '">' + ic(icon, 'sm') + text +
    '<input type="file" data-key="' + key + '" data-src="' + (capture ? 'cam' : 'gal') + '" accept="' + accept + '"' + (capture ? ' capture="environment"' : '') + '></label>';
}
function pickButtons(a) {
  var k = a.key;
  if (!isTouch()) return pickBtn(k, 'upload', 'Pilih file', a.kind === 'image' ? 'image/*' : a.kind === 'video' ? 'video/*' : '', false, true);
  if (a.kind === 'image') return pickBtn(k, 'camera', 'Kamera', 'image/*', true, true) + pickBtn(k, 'folder', 'Galeri', 'image/*', false, false);
  if (a.kind === 'video') return pickBtn(k, 'video', 'Rekam', 'video/*', true, true) + pickBtn(k, 'folder', 'Galeri', 'video/*', false, false);
  if (a.kind === 'any') return pickBtn(k, 'folder', 'File', '', false, true) + pickBtn(k, 'camera', 'Foto layar', 'image/*', true, false);
  return pickBtn(k, 'folder', 'Pilih file', '', false, true);
}

function itemByKey(key) {
  var f = (S.boot.settings || []).filter(function (i) { return i.key === key; })[0];
  if (!f && S.form && S.form.v && S.form.v.caseType === 'Campaign') f = cmpItems(cmpDef(S.form)).filter(function (i) { return i.key === key; })[0];
  return f || { key: key, label: key, kind: 'any' };
}

/** File dipilih: langsung disimpan di HP (aman jika koneksi putus / aplikasi tertutup), lalu dikompres. */
function pickFile(key, file, src) {
  var F = S.form, item = itemByKey(key), pk = F.id + '|' + key;
  collect();
  var wmOn = opt('watermark', true);
  var wmData = wmOn ? wmInfo(F, item, file, src) : null;
  if (!file.size) { toast('File kosong / tidak bisa dibaca. Pilih ulang.'); return; }
  if ($('#ferr')) $('#ferr').classList.add('hidden');
  if (file.size > 500 * 1024 * 1024) { toast('File terlalu besar (maks 500 MB).'); return; }
  var isImg = /^image\//.test(file.type) || item.kind === 'image';
  var isVid = /^video\//.test(file.type) || item.kind === 'video';
  var old = F.files[key];
  var blobId = F.id + '|' + key + '|' + Date.now();
  S.proc[pk] = { pct: 0.05, label: 'Menyimpan file di HP…' };
  drawAtts();
  var finishProc = function () { delete S.proc[pk]; if (S.procWait[pk]) { S.procWait[pk](); delete S.procWait[pk]; } if (S.form === F) drawAtts(); };
  Blobs.put(blobId, file).then(function () { return true; }, function () { return 'mem'; }).then(function (stored) {
    if (old && old.blobId) Blobs.del(old.blobId);
    F.files[key] = { blobId: blobId, name: file.name || (key + (isImg ? '.jpg' : isVid ? '.mp4' : '')), type: file.type || 'application/octet-stream', size: file.size, origSize: file.size, status: 'ready', label: item.label, note: stored === 'mem' ? 'Penyimpanan HP penuh: jangan tutup aplikasi sampai terkirim' : '' };
    Drafts.save(F);
    if (isImg) {
      S.proc[pk] = { pct: 0.5, label: wmOn ? 'Memberi watermark & mengompres foto…' : 'Mengompres foto…' }; if (S.form === F) drawAtts();
      return compressImage(file, opt('kompres_foto', true), wmData).then(function (r) {
        if (!r) { if (wmOn && F.files[key]) F.files[key].note = 'Format foto tidak didukung: tanpa watermark'; return; }
        if (r.thumb) F.files[key].thumb = r.thumb;
        if (r.blob) return replaceBlob(F, key, r.blob, r.name, r.type).then(function () { if (r.wm && F.files[key]) F.files[key].note = '🕒 Watermark ' + fmtStamp(wmData.t); });
      });
    }
    if (isVid && canCompressVideo() && (wmOn || (opt('kompres_video', true) && file.size >= CONFIG.VID_MIN_BYTES))) return runVideoCompress(F, key, file, 0, wmData);
    if (isVid && wmOn && F.files[key]) F.files[key].note = isIOS() ? 'Watermark video belum didukung di iPhone (dikirim asli)' : 'HP tidak mendukung watermark video (dikirim asli)';
  }).catch(function () {
    toast('File "' + item.label + '" tidak bisa dibaca. Pilih ulang file tersebut.', 5000);
    delete F.files[key];
  }).then(function () { Drafts.save(F); finishProc(); });
}

function replaceBlob(F, key, blob, name, type) {
  var id2 = F.id + '|' + key + '|' + Date.now() + 'c';
  return Blobs.put(id2, blob).then(function () {
    var f = F.files[key]; if (!f) { Blobs.del(id2); return; }
    var oldId = f.blobId;
    f.blobId = id2; f.name = name; f.type = type; f.size = blob.size; f.uploadId = null; f.offset = 0; f.status = 'ready';
    Blobs.del(oldId);
  }).catch(function () { /* tetap pakai file asli */ });
}

function runVideoCompress(F, key, file, attempt, wm) {
  var pk = F.id + '|' + key, ctrl = new AbortController(), hidden = false;
  var onVis = function () { if (document.visibilityState === 'hidden') { hidden = true; ctrl.abort(); } };
  document.addEventListener('visibilitychange', onVis);
  var verb = wm ? 'Memberi watermark video' : 'Mengompres video';
  S.proc[pk] = { pct: 0, label: verb + '… (tetap buka aplikasi)', cancel: function () { ctrl.abort(); } };
  if (S.form === F) drawAtts();
  var t0 = Date.now();
  var tick = throttle(function () { if (S.form === F && $('#att_' + key)) drawAtts(); }, 700);
  return compressVideo(file, function (p, left) {
    S.proc[pk].pct = p; S.proc[pk].label = verb + '… ' + Math.round(p * 100) + '% (±' + Math.ceil(left) + ' dtk lagi, tetap buka aplikasi)';
    tick();
  }, ctrl.signal, wm).then(function (r) {
    document.removeEventListener('visibilitychange', onVis);
    if (r.thumb && F.files[key]) F.files[key].thumb = r.thumb;
    if (r.out) {
      var before = file.size;
      return replaceBlob(F, key, r.out.blob, r.out.name, r.out.type).then(function () {
        if (F.files[key]) { F.files[key].origSize = before; F.files[key].note = (r.out.wm ? '🕒 Watermark ditambahkan' : 'Video dikompres') + ' dalam ' + Math.round((Date.now() - t0) / 1000) + ' detik'; }
      });
    }
    if (hidden && attempt < 1) {
      // aplikasi sempat ditinggalkan: ulangi saat dibuka lagi
      S.proc[pk] = { pct: 0, label: 'Kompres video menunggu aplikasi dibuka…', cancel: null };
      return new Promise(function (res) {
        var h = function () { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', h); res(runVideoCompress(F, key, file, attempt + 1, wm)); } };
        document.addEventListener('visibilitychange', h);
      });
    }
    if (F.files[key] && r.reason !== 'sudah kecil' && r.reason !== 'tidak lebih kecil') F.files[key].note = 'Dikirim ukuran asli' + (wm ? ' tanpa watermark' : '') + (r.reason === 'batal' ? ' (dilewati)' : '');
  });
}
function throttle(fn, ms) { var last = 0; return function () { var n = Date.now(); if (n - last > ms) { last = n; fn(); } }; }

function waitProcessing(F) {
  var keys = Object.keys(S.proc).filter(function (k) { return k.indexOf(F.id + '|') === 0; });
  return Promise.all(keys.map(function (k) { return new Promise(function (r) { if (!S.proc[k]) r(); else S.procWait[k] = r; }); }));
}

/* ================= validasi form & kirim ================= */
function markBad(id, msg) {
  var e = $('#' + id); if (!e) return;
  e.classList.add('bad-input');
  var n = e.parentNode.querySelector('.ferr');
  if (!n) { n = document.createElement('div'); n.className = 'ferr'; e.parentNode.appendChild(n); }
  n.textContent = msg;
}
function submitForm(ev, partial) {
  if (ev) ev.preventDefault();
  collect();
  var F = S.form, v = F.v, er = $('#ferr'), miss = [], firstBad = null;
  $$('.ferr').forEach(function (n) { n.remove(); }); $$('.bad-input').forEach(function (n) { n.classList.remove('bad-input'); }); $$('.att.missing').forEach(function (n) { n.classList.remove('missing'); });
  er.classList.add('hidden');
  var need = function (ok, id, label, msg) { if (!ok) { miss.push(label); markBad(id, msg || 'Wajib diisi'); if (!firstBad) firstBad = $('#' + id); } };
  need(!!v.outlet, 'f_outlet', 'Outlet');
  need(/^[A-HJ-NPR-Z0-9]{17}$/i.test(v.vin), 'f_vin', 'VIN', 'VIN harus 17 karakter (tanpa huruf I, O, Q)');
  need(!!v.nopol.trim(), 'f_nopol', 'Nopol');
  need(!!v.model.trim(), 'f_model', 'Model');
  var isCmp = v.caseType === 'Campaign';
  if (isCmp) {
    need(!!v.customer.trim(), 'f_customer', 'Customer');
    var cdef = cmpDef(F);
    ((cdef && cdef.fields) || []).forEach(function (f) { if (f.wajib) need(!!String(v.cdata[f.id] || '').trim(), 'cf_' + f.id, f.label); });
  } else {
  need(!!v.odo.trim(), 'f_odo', 'ODO');
  need(!!v.failureDate, 'f_date', 'Failure Date');
  need(!!v.customer.trim(), 'f_customer', 'Customer');
  if (!v.caseType) { miss.push('Jenis kasus'); if (!firstBad) firstBad = $('#f_type'); }
  }
  if (!isCmp) [['feedback', 'f_feedback', v.feedback], ['rootcause', 'f_root', v.rootcause], ['corrective', 'f_corr', v.corrective], ['remarks', 'f_rem', v.remarks]].forEach(function (x) {
    var cfg = fieldCfg(x[0]); if (cfg.tampil && cfg.wajib) need(!!String(x[2] || '').trim(), x[1], cfg.label);
  });
  var sc = fieldCfg('steps');
  if (!isCmp && sc.tampil && sc.wajib && !String(v.steps[0] || '').trim()) { miss.push(sc.label + ' (Step 1)'); var s0 = $('[data-step="0"]'); if (s0) { s0.classList.add('bad-input'); if (!firstBad) firstBad = s0; } }
  if (!partial) formItems().forEach(function (a) {
    if (a.wajib && !F.files[a.key] && !(F.existing && F.existing[a.key])) { miss.push(a.label); var el = $('#att_' + a.key); if (el) { el.classList.add('missing'); if (!firstBad) firstBad = el; } }
  });
  if (miss.length) {
    er.innerHTML = ic('warn') + '<span><b>' + (partial ? 'Isi dulu data ini sebelum disimpan' : 'Belum lengkap') + ' (' + miss.length + '):</b> ' + miss.map(esc).join(', ') + '</span>';
    er.classList.remove('hidden');
    (firstBad || er).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // file dari jenis kasus lain (mis. sempat pilih Electrical lalu ganti) tidak ikut dikirim
  var valid = {}; formItems().forEach(function (a) { valid[a.key] = true; });
  Object.keys(F.files).forEach(function (k) { if (!valid[k] && F.files[k].status !== 'done') { Blobs.del(F.files[k].blobId); delete F.files[k]; } });
  startSend(F, partial);
}

function startSend(F, partial) {
  var pending = Object.keys(S.proc).some(function (k) { return k.indexOf(F.id + '|') === 0; });
  F.state = 'sending'; F.err = ''; F.submitted = false; F.partial = !!partial;
  Drafts.save(F).then(refreshLocalDrafts).then(function () {
    showSendSheet(F.id, pending ? 'Menunggu proses kompres selesai…' : '');
    Sender.start(F.id);
  });
}

/* ================= dokumentasi after ================= */
function renderAfterForm(m, F) {
  var a = F.after;
  var h = '<div class="form-wrap"><form id="frm" autocomplete="off" novalidate>' +
    '<div class="hero" style="padding:14px 18px"><h1>Dokumentasi After Penggantian</h1><p class="mono">' + esc(F.v.vin) + ' · ' + esc(F.v.nopol) + '</p></div>' +
    (F.state === 'error' && F.err ? '<div class="msg err">' + ic('warn') + '<span>Pengiriman sebelumnya gagal: ' + esc(F.err) + '</span></div>' : '') +
    '<div class="savebar" id="saveState">' + ic('check', 'xs') + ' Draft tersimpan otomatis di HP</div>' +
    '<div class="card"><h2><span class="hic">' + ic('box') + '</span>Kode part</h2><div class="stack">' +
    '<div class="two"><div><label>Kode part lama <span class="opt">(opsional)</span></label><input type="text" id="a_lama" value="' + esc(a.partLamaNo) + '" autocapitalize="characters"></div>' +
    '<div><label>Kode part baru <span class="opt">(opsional)</span></label><input type="text" id="a_baru" value="' + esc(a.partBaruNo) + '" autocapitalize="characters"></div></div>' +
    '<div><label>Catatan <span class="opt">(opsional)</span></label><textarea id="a_note" style="min-height:64px">' + esc(a.note) + '</textarea></div></div></div>' +
    '<div class="card"><h2><span class="hic or">' + ic('clip') + '</span>Foto & video after</h2><div class="small" id="attc" style="font-weight:700"></div><div class="prog"><i id="attp"></i></div><div id="atts"></div></div>' +
    '<div id="ferr" class="msg err hidden"></div><div class="sendbar"><button class="btn or block" type="submit" id="fSend">' + ic('send') + ' Kirim dokumentasi after</button></div>' +
    '<button type="button" class="btn sec block" id="fCancel" style="margin-top:10px">Tutup form (draft tetap tersimpan)</button></form></div>';
  m.innerHTML = h;
  drawAtts();
  $('#frm').addEventListener('input', function () { collect(); saveFormSoon(); });
  $('#fCancel').onclick = function () { flushForm(); S.form = null; go('home'); };
  $('#frm').onsubmit = function (ev) {
    ev.preventDefault(); collect();
    var miss = [], firstBad = null, er = $('#ferr');
    $$('.att.missing').forEach(function (n) { n.classList.remove('missing'); });
    formItems().forEach(function (it) {
      if (it.wajib && !F.files[it.key] && !(F.existing && F.existing[it.key])) { miss.push(it.label); var el = $('#att_' + it.key); if (el) { el.classList.add('missing'); if (!firstBad) firstBad = el; } }
    });
    if (miss.length) { er.innerHTML = ic('warn') + '<span><b>Belum lengkap:</b> ' + miss.map(esc).join(', ') + '</span>'; er.classList.remove('hidden'); (firstBad || er).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    er.classList.add('hidden');
    startSend(F);
  };
}

/* ================= pengiriman (upload tahan putus) ================= */
var wakeLock = null;
function wake(on) {
  try {
    if (on && navigator.wakeLock && document.visibilityState === 'visible' && !wakeLock) {
      navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; l.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {});
    } else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
  } catch (e) { /* */ }
}
function anySending() { return Object.keys(Sender.active).length > 0; }
function busy() { return anySending() || S.tab === 'input'; }

function waitOnline(prog) {
  if (prog) { prog.waiting = true; renderSendUI(); }
  return new Promise(function (res) {
    var done = false;
    var fin = function () { if (done) return; done = true; window.removeEventListener('online', on); clearInterval(iv); if (prog) { prog.waiting = false; renderSendUI(); } res(); };
    var on = function () { setTimeout(fin, 800); };
    window.addEventListener('online', on);
    var n = 0;
    var iv = setInterval(function () { n++; if (navigator.onLine && n >= 3) fin(); }, 3000);
  });
}

/** Panggil API; jika koneksi putus tunggu sampai online lalu ulangi. */
function apiNet(prog) {
  var args = Array.prototype.slice.call(arguments, 1), fails = 0;
  function go() {
    return api.apply(null, args).catch(function (e) {
      if (e.kind === 'auth' || e.kind === 'config') throw e;
      if (e.kind === 'net') { fails++; return waitOnline(prog).then(function () { return sleep(Math.min(20000, 1000 * fails)); }).then(go); }
      if (isRetryable(e) && ++fails <= 6) { if (prog) { prog.msg = 'Server sibuk, mencoba lagi…'; renderSendUI(); } return sleep(Math.min(30000, 1500 * Math.pow(2, fails))).then(go); }
      throw e;
    });
  }
  return go();
}

var Sender = {
  active: {},
  start: function (id) {
    if (Sender.active[id]) return Sender.active[id];
    var p = Sender.run(id).finally(function () { delete Sender.active[id]; if (!anySending()) wake(false); renderSendUI(); renderNav(); });
    Sender.active[id] = p;
    renderSendUI();
    return p;
  },
  run: function (id) {
    var d, prog = S.sendProg[id] = { phase: 'prep', files: {}, msg: '', waiting: false, label: '' };
    var save = function () { return Drafts.save(d); };
    wake(true);
    // pakai objek form yang sedang terbuka (agar hasil kompres yang masih berjalan ikut terkirim)
    var mem = S.form && S.form.id === id ? Promise.resolve(S.form) : Drafts.get(id);
    return mem.then(function (dd) {
      d = dd;
      if (!d) throw new AppError('Draft tidak ditemukan.');
      prog.label = (d.kind === 'after' ? 'Dokumentasi after · ' : '') + (d.v && d.v.vin ? d.v.vin : 'Kasus baru');
      d.state = 'sending'; d.err = '';
      Object.keys(d.files).forEach(function (k) { prog.files[k] = { label: d.files[k].label || k, pct: d.files[k].status === 'done' ? 1 : 0, status: d.files[k].status === 'done' ? 'done' : 'wait' }; });
      return save();
    }).then(function () {
      prog.phase = 'compress'; renderSendUI();
      return waitProcessing(d);
    }).then(function () {
      Object.keys(d.files).forEach(function (k) { prog.files[k] = prog.files[k] || { label: d.files[k].label || k, pct: 0, status: 'wait' }; });
      prog.phase = 'save'; renderSendUI();
      if (d.submitted) return;
      if (d.kind === 'after') return apiNet(prog, 'submitAfter', d.caseId, d.after).then(function () { d.submitted = true; return save(); });
      if (!d.clientKey) d.clientKey = d.id + '@' + (d.createdAt || Date.now());
      return apiNet(prog, 'submitCase', d.v, d.caseId || null, d.clientKey).then(function (r) { d.caseId = r.caseId; d.serverStatus = r.status; d.submitted = true; return save(); });
    }).then(function () {
      prog.phase = 'upload'; renderSendUI();
      var keys = Object.keys(d.files).filter(function (k) { return d.files[k] && d.files[k].status !== 'done'; });
      return pool(keys, CONFIG.PARALLEL, function (k) { return uploadOne(d, k, prog, save, 0); });
    }).then(function () {
      prog.phase = 'final'; renderSendUI();
      if (d.kind === 'after') return apiNet(prog, 'finalizeAfter', d.caseId);
      if (d.partial) return;
      if (d.serverStatus === T.DRAFT || !d.serverStatus) return apiNet(prog, 'finalizeCase', d.caseId);
    }).then(function () {
      prog.phase = 'done'; prog.msg = '';
      var label = d.partial ? 'Tersimpan sebagai Draft ✔ Lanjutkan di laptop: buka jokopriyanto-cmd.github.io → login → buka draft ini → lengkapi file → Kirim.' :
        d.kind === 'after' ? 'Dokumentasi after terkirim ✔' : (d.serverStatus === T.DRAFT || !d.serverStatus ? 'Terkirim ✔ Status: Pending Input VTAG (menunggu foreman)' : 'Perubahan tersimpan ✔');
      toast(label, d.partial ? 9000 : 5000);
      prog.partial = !!d.partial;
      if (S.form && S.form.id === id) S.form = null;
      if (d.kind === 'case' && !d.partial && (d.serverStatus === T.DRAFT || !d.serverStatus)) {
        var row = rows().filter(function (r) { return r.id === d.caseId; })[0];
        if (row) row.status = T.PENDING;
      }
      return Drafts.remove(d).then(function () {
        S.rev = null; syncNow();
        if (S.tab === 'input' && !S.form) { S.tab = 'home'; renderNav(); renderView(); }
        setTimeout(function () {
          if (sendSheetId === id && $('#sendSheet') && !d.partial) { closeModal(); sendSheetId = null; }
          if (S.sendProg[id] && S.sendProg[id].phase === 'done' && !(sendSheetId === id && $('#sendSheet'))) { delete S.sendProg[id]; renderSendUI(); }
        }, 2500);
      });
    }).catch(function (e) {
      prog.phase = 'error'; prog.msg = errMsg(e);
      if (d) { d.state = 'error'; d.err = errMsg(e); Drafts.save(d).then(refreshLocalDrafts); }
      if (e.kind === 'auth') return;
      toast('Gagal mengirim: ' + errMsg(e), 6000);
    }).then(function () { renderSendUI(); if (S.tab === 'input' && S.form && S.form.id === id) renderView(); });
  }
};

function pool(items, n, fn) {
  var i = 0, err = null;
  function worker() {
    if (err || i >= items.length) return Promise.resolve();
    var it = items[i++];
    return fn(it).then(worker, function (e) { err = err || e; });
  }
  var ws = []; for (var k = 0; k < Math.min(n, items.length); k++) ws.push(worker());
  return Promise.all(ws).then(function () { if (err) throw err; });
}

function uploadOne(d, key, prog, save, restarts) {
  var f = d.files[key], P = prog.files[key] || (prog.files[key] = { label: f.label || key, pct: 0, status: 'wait' });
  var label = f.label || key, blob, size;
  P.status = 'up'; renderSendUI();
  return Blobs.get(f.blobId).then(function (b) {
    if (!b) throw new AppError('File "' + label + '" hilang dari HP. Buka form, pilih ulang file tersebut, lalu kirim lagi.', 'file');
    blob = b; size = b.size;
    if (f.uploadId) {
      return apiNet(prog, 'uploadStatus', f.uploadId).then(function (st) {
        if (st.expired) { f.uploadId = null; f.offset = 0; return; }
        if (st.done) { f.offset = size; return 'done'; }
        f.offset = st.next || 0;
      });
    }
  }).then(function (st) {
    if (st === 'done') return;
    var startP = f.uploadId ? Promise.resolve() : apiNet(prog, 'startUpload', d.caseId, key, f.name, f.type || 'application/octet-stream', size, d.kind === 'after' ? 'after' : 'before')
      .then(function (r) { f.uploadId = r.uploadId; f.offset = 0; return save(); });
    return startP.then(function () { return chunkLoop(d, key, f, blob, size, prog, P, save, restarts); });
  }).then(function () {
    f.status = 'done'; f.offset = size; P.pct = 1; P.status = 'done'; renderSendUI();
    return save();
  });
}

function chunkLoop(d, key, f, blob, size, prog, P, save, restarts) {
  var off = f.offset || 0, fails = 0, lastSave = 0;
  function next() {
    if (off >= size) return Promise.resolve();
    var end = Math.min(off + CONFIG.CHUNK, size);
    return blob.slice(off, end).arrayBuffer().then(function (buf) { return ab2b64(buf); }, function () {
      throw new AppError('File "' + (f.label || key) + '" tidak bisa dibaca dari HP. Buka form & pilih ulang file tersebut.', 'file');
    }).then(function (b64) {
      return api('uploadChunk', f.uploadId, off, b64).then(function (r) {
        fails = 0;
        if (r.expired) return 'restart';
        off = r.done ? size : r.next;
      }, function (e) {
        if (e.kind === 'auth' || e.kind === 'config') throw e;
        var p;
        if (e.kind === 'net') p = waitOnline(prog);
        else { if (++fails > 6) throw e; prog.msg = 'Server sibuk, mencoba lagi…'; renderSendUI(); p = sleep(Math.min(30000, 1500 * Math.pow(2, fails))); }
        return p.then(function () { return apiNet(prog, 'uploadStatus', f.uploadId); }).then(function (st) {
          if (st.expired) return 'restart';
          off = st.done ? size : (st.next || 0);
        });
      });
    }).then(function (r) {
      if (r === 'restart') {
        if (restarts >= 2) throw new AppError('Upload "' + (f.label || key) + '" berulang kali gagal. Coba lagi nanti.', 'app');
        f.uploadId = null; f.offset = 0;
        return save().then(function () { return uploadOne(d, key, prog, save, restarts + 1); }).then(function () { off = size; });
      }
      f.offset = off; P.pct = off / size; prog.msg = ''; renderSendUI();
      if (Date.now() - lastSave > 3000) { lastSave = Date.now(); save(); }
      return next();
    });
  }
  return next();
}

function resumeSending() {
  if (!S.user || !navigator.onLine) return;
  Drafts.mine().then(function (list) {
    S.localDrafts = list; renderNav(); renderPill();
    list.filter(function (d) { return d.state === 'sending'; }).forEach(function (d) { if (!Sender.active[d.id]) Sender.start(d.id); });
  });
}

/* ================= tampilan progres kirim ================= */
var sendSheetId = null;
function showSendSheet(id, msg) { sendSheetId = id; if (msg && S.sendProg[id]) S.sendProg[id].msg = msg; drawSendSheet(true); }
function phaseText(p) {
  return { prep: 'Menyiapkan…', compress: 'Menunggu kompres selesai…', save: 'Menyimpan data kasus…', upload: 'Mengunggah file…', final: 'Memeriksa kelengkapan…', done: 'Selesai ✔', error: 'Gagal mengirim' }[p.phase] || '';
}
function drawSendSheet(open) {
  var id = sendSheetId, p = S.sendProg[id];
  if (!id) return;
  if (!open && !$('#sendSheet')) return;
  if (!p) { if (!open) return; p = { phase: 'prep', files: {} }; }
  var keys = Object.keys(p.files), tot = 0;
  keys.forEach(function (k) { tot += p.files[k].pct || 0; });
  var pct = keys.length ? tot / keys.length : 0;
  var h = '<div id="sendSheet"><h3>' + (p.phase === 'done' ? (p.partial ? 'Tersimpan sebagai Draft 💾' : 'Berhasil terkirim 🎉') : p.phase === 'error' ? 'Pengiriman terhenti' : 'Mengirim data…') + '</h3>' +
    '<div class="muted small" style="margin-top:3px">' + esc(p.label || '') + '</div>' +
    '<div class="prog blue" style="margin-top:12px"><i style="width:' + Math.round((p.phase === 'done' ? 1 : pct) * 100) + '%"></i></div>' +
    '<div class="small" style="font-weight:700">' + esc(phaseText(p)) + (p.phase === 'upload' ? ' ' + Math.round(pct * 100) + '%' : '') + '</div>';
  if (p.phase === 'done' && p.partial) h += '<div class="msg info">' + ic('upload') + '<span>Lanjutkan di laptop: buka <b>jokopriyanto-cmd.github.io</b> → login akun yang sama → Beranda → <b>Draft belum lengkap</b> → Edit / lengkapi → upload SWBOOM, DTC & TBOX log → <b>Kirim ke Foreman</b>.</span></div>';
  if (p.waiting) h += '<div class="msg err">' + ic('wifioff') + '<span><b>Koneksi internet terputus.</b> Upload otomatis lanjut dari posisi terakhir saat koneksi kembali. Data aman tersimpan di HP.</span></div>';
  else if (p.phase === 'error') h += '<div class="msg err">' + ic('warn') + '<span>' + esc(p.msg) + '</span></div>';
  else if (p.msg) h += '<div class="msg warn">' + ic('clock') + '<span>' + esc(p.msg) + '</span></div>';
  if (p.phase !== 'done' && p.phase !== 'error') h += '<div class="msg info">' + ic('shield') + '<span>Usahakan aplikasi tetap terbuka. Jika ditutup / layar mati, upload otomatis lanjut saat aplikasi dibuka lagi.</span></div>';
  h += '<div>' + keys.map(function (k) {
    var f = p.files[k];
    return '<div class="upl"><div class="h"><span>' + esc(f.label) + '</span><span class="small muted">' + (f.status === 'done' ? '✓ selesai' : f.status === 'up' ? Math.round((f.pct || 0) * 100) + '%' : 'menunggu') + '</span></div><div class="progress ' + (f.status === 'done' ? 'ok' : '') + '"><i style="width:' + Math.round((f.pct || 0) * 100) + '%"></i></div></div>';
  }).join('') + '</div><div class="stack" style="margin-top:14px">';
  if (p.phase === 'error') h += '<button class="btn or block" id="sRetry">' + ic('refresh') + ' Coba kirim lagi</button><button class="btn sec block" id="sEdit">Buka form</button>';
  h += '<button class="btn sec block" id="sHide">' + (p.phase === 'done' || p.phase === 'error' ? 'Tutup' : 'Sembunyikan (upload tetap jalan)') + '</button></div></div>';
  if ($('#sendSheet')) $('#sendSheet').parentNode.innerHTML = h; else modal(h, 'narrow');
  if ($('#sRetry')) $('#sRetry').onclick = function () {
    Drafts.get(id).then(function (d) { if (!d) return; d.state = 'sending'; d.err = ''; return Drafts.save(d); }).then(function () { Sender.start(id); });
  };
  if ($('#sEdit')) $('#sEdit').onclick = function () {
    Drafts.get(id).then(function (d) { if (!d) return; d.state = 'editing'; return Drafts.save(d).then(function () { closeModal(); sendSheetId = null; S.form = d; S.tab = 'input'; renderNav(); renderView(); }); });
  };
  $('#sHide').onclick = function () { closeModal(); sendSheetId = null; renderPill(); };
}
var renderSendUI = throttle2(function () { drawSendSheet(false); renderPill(); if (S.tab === 'input' && S.form && S.form.state === 'sending' && $('#sendView')) renderView(); }, 250);
function throttle2(fn, ms) { var t = null, pend = false; return function () { if (t) { pend = true; return; } fn(); t = setTimeout(function () { t = null; if (pend) { pend = false; fn(); } }, ms); }; }

function renderPill() {
  var host = $('#pillHost'); if (!host) return;
  var ids = Object.keys(S.sendProg).filter(function (k) { var p = S.sendProg[k]; return p.phase !== 'done'; });
  if (!ids.length || $('#sendSheet')) { host.innerHTML = ''; return; }
  var p = S.sendProg[ids[0]], keys = Object.keys(p.files), tot = 0;
  keys.forEach(function (k) { tot += p.files[k].pct || 0; });
  var err = p.phase === 'error';
  host.innerHTML = '<button class="sendpill ' + (err || p.waiting ? 'err' : '') + '" id="pill">' + ic(err ? 'warn' : p.waiting ? 'wifioff' : 'upload') + (err ? 'Gagal kirim — ketuk' : p.waiting ? 'Menunggu koneksi…' : 'Mengirim ' + Math.round((keys.length ? tot / keys.length : 0) * 100) + '%') + '</button>';
  $('#pill').onclick = function () { showSendSheet(ids[0]); };
}

function renderSendingView(m, F) {
  m.innerHTML = '<div id="sendView" class="form-wrap"><div class="hero"><h1>Sedang mengirim</h1><p>' + esc(F.v && F.v.vin ? F.v.vin : '') + '</p></div><div class="card">Data ini sedang dikirim. <button class="btn sm" id="svOpen">Lihat progres</button></div></div>';
  $('#svOpen').onclick = function () { showSendSheet(F.id); };
}

/* ================= admin ================= */
function renderAdmin(m) {
  if (!isManager()) { S.tab = 'home'; return renderHome(m); }
  var tabs = adminTabs();
  if (!tabs.some(function (t) { return t[0] === S.adminTab; })) S.adminTab = 'users';
  m.innerHTML = '<div class="hero" style="padding:14px 18px"><h1>' + (isAdmin() ? 'Admin' : 'Service Manager') + '</h1><p>' + (isAdmin() ? 'Kelola pengguna, pengaturan, campaign & data' : 'Kelola akun mekanik/foreman/partman, pengaturan form & export data') + '</p><div class="acts">' +
    tabs.map(function (t) { return '<button class="btn ' + (S.adminTab === t[0] ? 'white' : 'sec') + ' sm" data-at="' + t[0] + '">' + ic(t[2], 'sm') + ' ' + t[1] + '</button>'; }).join('') + '</div></div><div id="adm"></div>';
  $$('[data-at]', m).forEach(function (b) { b.onclick = function () { S.adminTab = b.dataset.at; renderNav(); renderAdmin(m); }; });
  var el = $('#adm');
  if (S.adminTab === 'settings') renderSettings(el);
  else if (S.adminTab === 'export') renderExport(el);
  else if (S.adminTab === 'campaign') renderCampaigns(el);
  else if (S.adminTab === 'bulk') renderBulk(el);
  else renderUsers(el);
}
function renderBulkPage(m) {
  if (!(role() === 'foreman' || isAdmin())) { S.tab = 'home'; return renderHome(m); }
  m.innerHTML = '<div class="form-wrap"><div class="hero" style="padding:14px 18px"><h1>Tugaskan kasus (input massal)</h1><p>Buat banyak kasus sekaligus dari Excel. Mekanik tinggal melengkapi data & lampiran.</p></div><div id="bulkEl"></div></div>';
  renderBulk($('#bulkEl'));
}

function renderUsers(el) {
  el.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>';
  apiRetry('listUsers').then(function (list) {
    var q = '';
    el.innerHTML = '<div class="two" style="margin-bottom:12px"><button class="btn or" id="uNew">' + ic('plus') + ' Tambah</button><button class="btn" id="uBulk">' + ic('users') + ' Bulk akun</button></div>' +
      (isAdmin() ? '' : '<div class="msg info">' + ic('shield') + '<span>Service Manager dapat menambah, menonaktifkan & menghapus akun <b>mekanik, foreman & partman</b> di outlet ' + esc(S.user.outlet === '*' ? 'semua' : S.user.outlet) + '.</span></div>') +
      '<div class="search">' + ic('search') + '<input id="uq" type="search" placeholder="Cari nama / username / outlet…"></div><div class="card" style="padding:4px 16px" id="ulist"></div>';
    var draw = function () {
      var l = list.filter(function (u) { return !q || (u.nama + ' ' + u.username + ' ' + u.outlet + ' ' + u.role).toLowerCase().indexOf(q) >= 0; });
      $('#ulist').innerHTML = l.map(function (u) {
        return '<button class="urow" data-u="' + esc(u.username) + '"><span class="avatar" style="' + (u.aktif ? '' : 'background:#9aa3b5') + '">' + esc(initials(u.nama)) + '</span><span class="info"><b>' + esc(u.nama) + (u.aktif ? '' : ' <span class="tag">nonaktif</span>') + '</b><span class="muted small">@' + esc(u.username) + ' · ' + esc(roleName(u.role)) + ' · ' + esc(u.outlet === '*' ? 'Semua outlet' : u.outlet) + '</span></span>' + ic('chev', 'sm') + '</button>';
      }).join('') || '<div class="empty">Tidak ada.</div>';
      $$('[data-u]').forEach(function (b) { b.onclick = function () { userModal(list.filter(function (x) { return x.username === b.dataset.u; })[0], el); }; });
    };
    $('#uq').oninput = function () { q = this.value.toLowerCase(); draw(); };
    $('#uNew').onclick = function () { userModal(null, el); };
    $('#uBulk').onclick = function () { bulkModal(el); };
    draw();
  }, function (e) { el.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
}

function userModal(u, el) {
  var isNew = !u; u = u || { username: '', nama: '', role: 'mekanik', outlet: isAdmin() || S.user.outlet === '*' ? '' : S.user.outlet, aktif: true };
  var roles = isAdmin() ? ['mekanik', 'foreman', 'partman', 'sm', 'admin'] : ['mekanik', 'foreman', 'partman'];
  var outs = isAdmin() || S.user.outlet === '*' ? S.boot.outlets : [S.user.outlet];
  var canAll = isAdmin() || S.user.outlet === '*';
  modal('<h3>' + (isNew ? 'Tambah pengguna' : 'Ubah ' + esc(u.username)) + '</h3><div class="stack" style="margin-top:14px">' +
    '<div><label>Username</label><input type="text" id="mu" value="' + esc(u.username) + '" ' + (isNew ? '' : 'readonly style="background:var(--gray-bg)"') + ' autocapitalize="none"></div>' +
    '<div><label>Nama</label><input type="text" id="mn" value="' + esc(u.nama) + '"></div>' +
    '<div class="two"><div><label>Role</label><select id="mr">' + roles.map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + roleName(r) + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Status</label><select id="ma"><option value="1"' + (u.aktif ? ' selected' : '') + '>Aktif</option><option value="0"' + (!u.aktif ? ' selected' : '') + '>Nonaktif</option></select></div></div>' +
    '<div><label>Outlet</label><select id="mo">' + (canAll ? '<option value="*"' + (u.outlet === '*' ? ' selected' : '') + '>* (semua outlet)</option>' : '') + outs.map(function (o) { return '<option' + (u.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>' +
    '<div><label>' + (isNew ? 'Password awal (min. 8)' : 'Reset password (kosongkan jika tidak)') + '</label>' + pwField('mp', 'new-password') + '</div></div>' +
    '<div id="merr" class="msg err hidden"></div><div class="stack" style="margin-top:14px"><button class="btn block" id="ms">Simpan</button>' +
    (!isNew && u.username !== S.user.username && serverAtLeast('2.3') ? '<button class="btn bad block" id="md">' + ic('trash') + ' Hapus akun</button>' : '') + '<button class="btn sec block" id="mc">Batal</button></div>', 'narrow');
  $('#mc').onclick = closeModal;
  if ($('#md')) $('#md').onclick = function () {
    confirmBox({ title: 'Hapus akun ' + u.username + '?', body: 'Akun ' + u.nama + ' (' + roleName(u.role) + ') dihapus permanen & tidak bisa login lagi. Data kasus yang pernah diinput tetap tersimpan. Jika hanya sementara, pilih Status: Nonaktif.', ok: 'Hapus akun', danger: true })
      .then(function (y) {
        if (!y) return userModal(u, el);
        busyModal('Menghapus akun…');
        api('deleteUser', u.username).then(function () { closeModal(); toast('Akun dihapus.'); renderUsers(el); }, function (e) { closeModal(); toast(errMsg(e)); });
      });
  };
  $('#ms').onclick = function () {
    var er = $('#merr'), btn = this; er.classList.add('hidden'); btn.disabled = true;
    api('saveUser', { username: $('#mu').value, nama: $('#mn').value, role: $('#mr').value, outlet: $('#mo').value, password: $('#mp').value, aktif: $('#ma').value === '1', isNew: isNew }).then(function () {
      closeModal(); toast('Pengguna disimpan.'); renderUsers(el);
    }, function (e) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); btn.disabled = false; });
  };
}

function copyText(txt, ta) {
  var fb = function () { try { ta.focus(); ta.select(); var ok = document.execCommand('copy'); toast(ok ? 'Tersalin.' : 'Tekan tahan lalu pilih Salin.'); } catch (e) { toast('Blok teks lalu salin manual.'); } };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { toast('Tersalin.'); }, fb); return; } } catch (e) { /* */ }
  fb();
}

function bulkModal(el) {
  modal('<h3>Tambah banyak pengguna</h3>' +
    '<p class="muted small" style="margin:6px 0 12px">Tempel daftar dari Excel / Google Sheets. <b>Satu baris = satu orang.</b> Kolom: <b>Nama</b>, Username, Outlet, Role, Password. Hanya Nama yang wajib — username dibuat dari nama, password acak.</p>' +
    '<div class="two"><div><label>Outlet default</label><select id="bo"><option value="">Pilih outlet…</option>' + (isAdmin() || S.user.outlet === '*' ? S.boot.outlets : [S.user.outlet]).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Role default</label><select id="br"><option>mekanik</option><option>foreman</option><option>partman</option>' + (isAdmin() ? '<option value="sm">Service Manager</option>' : '') + '</select></div></div>' +
    '<label style="margin-top:12px">Daftar pengguna</label><textarea id="bt" style="min-height:170px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px" placeholder="Budi Santoso&#10;Andi Pratama&#9;andi.p&#9;Otoklix Joglo"></textarea>' +
    '<div class="small muted" style="margin-top:6px">Maks. 300 baris. Username yang sudah ada dilewati. Pengguna baru wajib ganti password saat login pertama.</div>' +
    '<div id="berr" class="msg err hidden"></div><div class="stack" style="margin-top:14px"><button class="btn block" id="bgo">' + ic('users') + ' Buat akun</button><button class="btn sec block" id="bx">Batal</button></div>', 'narrow');
  $('#bx').onclick = closeModal;
  $('#bgo').onclick = function () {
    var er = $('#berr'), btn = this; er.classList.add('hidden'); btn.disabled = true; btn.textContent = 'Membuat akun… (±1 dtk/akun)'; modalLock = true;
    api('bulkCreateUsers', $('#bt').value, { outlet: $('#bo').value, role: $('#br').value }).then(function (r) {
      modalLock = false; bulkResult(r, el);
    }, function (e) { modalLock = false; er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); btn.disabled = false; btn.innerHTML = ic('users') + ' Buat akun'; });
  };
}
function bulkResult(r, el) {
  var tsv = ['Nama\tUsername\tPassword sementara\tRole\tOutlet'].concat(r.results.filter(function (x) { return x.status === 'ok'; }).map(function (x) { return [x.nama, x.username, x.password, x.role, x.outlet === '*' ? 'Semua' : x.outlet].join('\t'); })).join('\n');
  var rowsH = r.results.map(function (x) {
    var cls = x.status === 'ok' ? 'done' : x.status === 'skip' ? 'pending' : 'revisi', icn = x.status === 'ok' ? 'check' : x.status === 'skip' ? 'clock' : 'warn';
    return '<div class="upl row" style="align-items:flex-start"><span class="pill ' + cls + '">' + ic(icn, 'sm') + '</span><div style="flex:1;min-width:0"><b>' + esc(x.nama || '(kosong)') + '</b>' + (x.username ? ' <span class="mono small muted">@' + esc(x.username) + '</span>' : '') +
      '<div class="small" style="' + (x.status === 'error' ? 'color:var(--bad)' : 'color:var(--muted)') + '">' + (x.status === 'ok' ? esc(x.role) + ' · ' + (x.outlet === '*' ? 'Semua outlet' : esc(x.outlet)) + ' · password: <b class="mono">' + esc(x.password) + '</b>' : 'Baris ' + x.baris + ': ' + esc(x.msg)) + '</div></div></div>';
  }).join('');
  modal('<h3>Hasil tambah pengguna</h3><div class="two" style="margin:12px 0">' + kpi(r.created, 'Dibuat', 'ok', 'check', '') + kpi(r.failed + r.skipped, 'Gagal / dilewati', r.failed || r.skipped ? 'bad' : '', 'warn', '') + '</div>' +
    (r.created ? '<div class="msg ok"><span><b>Simpan password sekarang.</b> Password acak hanya tampil di sini.</span></div><textarea id="btsv" readonly style="min-height:90px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;white-space:pre">' + esc(tsv) + '</textarea><button class="btn or block" id="bcp" style="margin-top:8px">Salin semua (bisa ditempel ke Excel)</button>' : '') +
    '<div class="sec-t">Rincian</div><div>' + rowsH + '</div><button class="btn sec block" id="bdone" style="margin-top:14px">Selesai</button>', 'narrow');
  if ($('#bcp')) $('#bcp').onclick = function () { copyText(tsv, $('#btsv')); };
  $('#bdone').onclick = function () { closeModal(); renderUsers(el); };
}

function renderSettings(el) {
  el.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>';
  apiRetry('getSettings').then(function (list) {
    var groups = [['field', 'Isian detail kasus', 'Atur isian mana yang ditampilkan & wajib diisi mekanik.'], ['lampiran', 'Lampiran Mandatory Data VTAG', 'Wajib = harus diupload sebelum dikirim. Tampil mati = disembunyikan dari form.'],
      ['after', 'Dokumentasi After Penggantian', 'Diisi mekanik setelah kasus divalidasi foreman.'], ['opsi', 'Opsi aplikasi', '']];
    var changed = {};
    var h = '<div class="msg info">' + ic('gear') + '<span>Perubahan langsung berlaku untuk semua pengguna (tanpa ubah kode). Tekan <b>Simpan</b> setelah selesai. <b>Time stamp / watermark</b> foto-video ada di bagian <b>Opsi aplikasi</b> (paling bawah).</span></div>';
    groups.forEach(function (g) {
      var items = list.filter(function (i) { return i.jenis === g[0]; });
      if (!items.length) return;
      h += '<div class="card"><h2>' + esc(g[1]) + '</h2>' + (g[2] ? '<div class="small muted" style="margin:-6px 0 6px">' + esc(g[2]) + '</div>' : '') +
        items.map(function (i) {
          var tags = (i.kasus && i.kasus !== 'Semua' ? '<span class="tag">' + esc(i.kasus) + '</span> ' : '') + (i.model ? '<span class="tag">' + esc(i.model) + '</span>' : '');
          return '<div class="setrow ' + (i.tampil ? '' : 'off') + '" data-k="' + esc(i.key) + '"><div class="sl"><b>' + esc(i.label) + '</b>' + (tags || i.hint ? '<div class="small muted">' + tags + ' ' + esc(i.hint || '') + '</div>' : '') + '</div>' +
            '<label class="sw">' + (g[0] === 'opsi' ? 'Aktif' : 'Tampil') + '<input type="checkbox" data-f="tampil" ' + (i.tampil ? 'checked' : '') + '></label>' +
            (g[0] === 'opsi' ? '' : '<label class="sw">Wajib<input type="checkbox" data-f="wajib" ' + (i.wajib ? 'checked' : '') + (i.tampil ? '' : ' disabled') + '></label>') + '</div>';
        }).join('') + '</div>';
    });
    h += '<div class="sendbar"><button class="btn or block" id="setSave" disabled>' + ic('check') + ' Simpan pengaturan</button></div>';
    el.innerHTML = h;
    $$('.setrow input', el).forEach(function (cb) {
      cb.onchange = function () {
        var row = cb.closest('.setrow'), k = row.dataset.k;
        var t = row.querySelector('[data-f=tampil]'), w = row.querySelector('[data-f=wajib]');
        if (w) { w.disabled = !t.checked; if (!t.checked) w.checked = false; }
        row.classList.toggle('off', !t.checked);
        changed[k] = { key: k, tampil: t.checked, wajib: w ? w.checked : false };
        $('#setSave').disabled = false;
      };
    });
    $('#setSave').onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Menyimpan…';
      api('saveSettings', Object.keys(changed).map(function (k) { return changed[k]; })).then(function (s) {
        S.boot.settings = s; changed = {}; toast('Pengaturan disimpan & berlaku untuk semua pengguna.');
        btn.innerHTML = ic('check') + ' Simpan pengaturan';
      }, function (e) { toast(errMsg(e)); btn.disabled = false; btn.innerHTML = ic('check') + ' Simpan pengaturan'; });
    };
  }, function (e) { el.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
}

/* ================= v2.3: peran & menu kelola ================= */
function isManager() { return role() === 'admin' || role() === 'sm'; }
function roleName(r) { return { mekanik: 'Mekanik', foreman: 'Foreman', partman: 'Partman', sm: 'Service Manager', admin: 'Admin' }[r] || r; }
function serverAtLeast(v) { return !!(S.boot && S.boot.version && S.boot.version >= v); }
function adminTabs() {
  var t = [['users', 'Pengguna', 'users'], ['settings', 'Pengaturan', 'gear'], ['export', 'Export Excel', 'download']];
  if (isAdmin()) { t.push(['campaign', 'Campaign', 'box']); t.push(['bulk', 'Input massal', 'list']); }
  return t;
}
function draftsAll() { return rows().filter(function (r) { return r.status === T.DRAFT; }); }
function canMonitorDrafts() { return role() === 'foreman' || role() === 'sm' || isAdmin(); }

/* ================= v2.3: file Excel (.xlsx) tanpa library ================= */
var CRC_T = null;
function crc32(u) {
  if (!CRC_T) { CRC_T = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
  var x = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) x = CRC_T[(x ^ u[i]) & 255] ^ (x >>> 8);
  return (x ^ 0xFFFFFFFF) >>> 0;
}
function zipStore(files, mime) {
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  files.forEach(function (f) {
    var nm = enc.encode(f.name), d = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(d);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 0x21, true);
    h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(h.buffer), nm, d);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + d.length;
  });
  var csize = central.reduce(function (a, b) { return a + b.length; }, 0);
  var e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: mime || 'application/zip' });
}
function xmlEsc(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
/** sheets: [{name, rows:[[...]], widths:[..], text:true(semua kolom format teks), header:true}] */
function makeXlsx(sheets) {
  var wbSheets = '', rels = '', ct = '';
  var files = [];
  sheets.forEach(function (sh, si) {
    var n = si + 1, rowsX = '', maxC = 0;
    sh.rows.forEach(function (r, ri) {
      maxC = Math.max(maxC, r.length);
      rowsX += '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
        var ref = colName(ci) + (ri + 1), st = ri === 0 && sh.header !== false ? 1 : (sh.text ? 3 : 2);
        if (v === null || v === undefined || v === '') return sh.text && ri > 0 ? '<c r="' + ref + '" s="3"/>' : '';
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
        return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
      }).join('') + '</row>';
    });
    var cols = '';
    if (maxC) {
      cols = '<cols>';
      for (var c = 0; c < maxC; c++) cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + ((sh.widths && sh.widths[c]) || 16) + '" customWidth="1"' + (sh.text ? ' style="3"' : '') + '/>';
      cols += '</cols>';
    }
    var view = sh.header !== false ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    var filt = sh.header !== false && sh.rows.length > 1 && maxC ? '<autoFilter ref="A1:' + colName(maxC - 1) + sh.rows.length + '"/>' : '';
    files.push({ name: 'xl/worksheets/sheet' + n + '.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + view + cols + '<sheetData>' + rowsX + '</sheetData>' + filt + '</worksheet>' });
    wbSheets += '<sheet name="' + xmlEsc(String(sh.name).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31)) + '" sheetId="' + n + '" r:id="rId' + n + '"/>';
    rels += '<Relationship Id="rId' + n + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + n + '.xml"/>';
    ct += '<Override PartName="/xl/worksheets/sheet' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
  });
  var nS = sheets.length + 1;
  rels += '<Relationship Id="rId' + nS + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
  var head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  files.unshift(
    { name: '[Content_Types].xml', data: head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + ct + '</Types>' },
    { name: '_rels/.rels', data: head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: head + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + wbSheets + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels + '</Relationships>' },
    { name: 'xl/styles.xml', data: head + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002EB4"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' });
  return zipStore(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
function saveBlob(name, blob) {
  try {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 8000);
    toast('Mengunduh ' + name);
  } catch (e) { toast('Unduhan gagal: ' + errMsg(e)); }
}
function stampName() { var d = new Date(), p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }

/** Baca sheet pertama file .xlsx → array baris (array string). */
function readZip(buf) {
  var u = new Uint8Array(buf), dv = new DataView(buf), e = -1;
  for (var i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('File bukan Excel .xlsx. Simpan ulang sebagai "Excel Workbook (.xlsx)".');
  var n = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true), out = {}, dec = new TextDecoder();
  for (var k = 0; k < n; k++) {
    var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    var name = dec.decode(u.subarray(p + 46, p + 46 + nl));
    var start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    out[name] = { method: method, data: u.subarray(start, start + csz) };
    p += 46 + nl + xl + cl;
  }
  return out;
}
function unzipText(ent) {
  if (!ent) return Promise.resolve('');
  if (ent.method === 0) return Promise.resolve(new TextDecoder().decode(ent.data));
  if (ent.method !== 8 || !window.DecompressionStream) return Promise.reject(new Error('Browser ini belum bisa membaca file Excel. Salin baris dari Excel lalu tempel di kotak teks.'));
  return new Response(new Blob([ent.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
}
function colIdx(ref) { var m = String(ref).match(/^([A-Z]+)/); if (!m) return -1; var n = 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
function readXlsx(file) {
  return file.arrayBuffer().then(function (buf) {
    var z = readZip(buf), P = function (x) { return new DOMParser().parseFromString(x || '<x/>', 'application/xml'); };
    var tags = function (d, t) { return Array.prototype.slice.call(d.getElementsByTagName(t)); };
    return Promise.all([unzipText(z['xl/sharedStrings.xml']), unzipText(z['xl/workbook.xml']), unzipText(z['xl/_rels/workbook.xml.rels'])]).then(function (r) {
      var sh = tags(P(r[1]), 'sheet')[0], rid = sh && (sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      var target = 'worksheets/sheet1.xml';
      if (rid) tags(P(r[2]), 'Relationship').forEach(function (x) { if (x.getAttribute('Id') === rid) target = x.getAttribute('Target'); });
      var path = target.replace(/^\/+/, ''); if (path.indexOf('xl/') !== 0) path = 'xl/' + path;
      var ss = tags(P(r[0]), 'si').map(function (si) { return tags(si, 't').map(function (t) { return t.textContent; }).join(''); });
      return unzipText(z[path]).then(function (x) {
        return tags(P(x), 'row').map(function (row) {
          var arr = [];
          tags(row, 'c').forEach(function (c) {
            var col = colIdx(c.getAttribute('r') || ''), t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], val = '';
            if (t === 's') val = ss[+(v && v.textContent)] || '';
            else if (t === 'inlineStr') val = tags(c, 't').map(function (q) { return q.textContent; }).join('');
            else if (v) val = v.textContent;
            arr[col < 0 ? arr.length : col] = val;
          });
          for (var i = 0; i < arr.length; i++) if (arr[i] === undefined) arr[i] = '';
          return arr;
        });
      });
    });
  });
}

/* ================= v2.3: export data ================= */
function renderExport(el) {
  var f = S.exp || (S.exp = { from: '', to: '', outlet: '', status: '', jenis: '' });
  var outlets = isAdmin() || S.user.outlet === '*' ? S.boot.outlets : [S.user.outlet];
  var st = [T.DRAFT, T.PENDING, T.SUBMITTED, T.DONE, T.REVISI];
  el.innerHTML = '<div class="card"><h2><span class="hic">' + ic('download') + '</span>Export / tarik data ke Excel</h2>' +
    '<div class="small muted" style="margin:-6px 0 12px">Semua kolom yang sudah diinput (data kendaraan, investigasi, status VinFast, kode part, link folder Drive). Kosongkan filter untuk menarik semua data.</div>' +
    '<div class="stack"><div class="two"><div><label>Dari tanggal input</label><input type="date" id="xf" value="' + esc(f.from) + '"></div><div><label>Sampai</label><input type="date" id="xt" value="' + esc(f.to) + '"></div></div>' +
    '<div class="two"><div><label>Outlet</label><select id="xo"><option value="">Semua outlet</option>' + outlets.map(function (o) { return '<option' + (f.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Status</label><select id="xs"><option value="">Semua status</option>' + st.map(function (s) { return '<option' + (f.status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></div></div>' +
    '<div><label>Jenis</label><select id="xj"><option value="">VTAG & Campaign</option><option value="vtag"' + (f.jenis === 'vtag' ? ' selected' : '') + '>VTAG (Electrical / Mechanical)</option><option value="campaign"' + (f.jenis === 'campaign' ? ' selected' : '') + '>Campaign</option></select></div>' +
    '<div class="chips" style="margin:0">' + [['Hari ini', 0], ['7 hari', 7], ['Bulan ini', 'm'], ['Semua', null]].map(function (q, i) { return '<button class="chip" data-q="' + i + '">' + q[0] + '</button>'; }).join('') + '</div>' +
    '</div><div id="xerr" class="msg err hidden"></div><button class="btn or block" id="xgo" style="margin-top:14px">' + ic('download') + ' Download Excel</button></div>';
  var quick = [0, 7, 'm', null];
  $$('[data-q]', el).forEach(function (b) {
    b.onclick = function () {
      var q = quick[+b.dataset.q], d = new Date(), iso = function (x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); };
      if (q === null) { $('#xf').value = ''; $('#xt').value = ''; }
      else if (q === 'm') { $('#xf').value = iso(new Date(d.getFullYear(), d.getMonth(), 1)); $('#xt').value = iso(d); }
      else { $('#xf').value = iso(new Date(d.getTime() - q * 864e5)); $('#xt').value = iso(d); }
    };
  });
  $('#xgo').onclick = function () {
    var btn = this, er = $('#xerr');
    f.from = $('#xf').value; f.to = $('#xt').value; f.outlet = $('#xo').value; f.status = $('#xs').value; f.jenis = $('#xj').value;
    er.classList.add('hidden');
    if (!serverAtLeast('2.3')) { er.innerHTML = ic('warn') + '<span>Server belum versi 2.3. Admin: tempel Code.gs terbaru lalu Terapkan versi baru.</span>'; er.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Menarik data…';
    apiRetry('exportCases', f).then(function (list) {
      if (!list.length) { toast('Tidak ada data untuk filter ini.'); return; }
      var keys = Object.keys(list[0]);
      var wide = { 'Customer Feedback': 40, 'Action Taken': 45, 'Rootcause': 35, 'Corrective Action': 35, 'Remarks': 30, 'Data Campaign': 40, 'Folder Drive': 45, 'Catatan Foreman': 30, 'VIN': 22, 'Status': 24 };
      var data = [keys].concat(list.map(function (r) { return keys.map(function (k) { return k === 'Jumlah File' ? +r[k] || 0 : r[k]; }); }));
      // ringkasan per outlet & status
      var sum = {}, sts = [T.DRAFT, T.PENDING, T.SUBMITTED, T.DONE, T.REVISI];
      list.forEach(function (r) { var o = sum[r.Outlet] || (sum[r.Outlet] = {}); o[r.Status] = (o[r.Status] || 0) + 1; o._t = (o._t || 0) + 1; });
      var ring = [['Outlet'].concat(sts, ['Total'])].concat(Object.keys(sum).sort().map(function (o) { return [o].concat(sts.map(function (s) { return sum[o][s] || 0; }), [sum[o]._t]); }));
      var blob = makeXlsx([
        { name: 'Data Kasus', rows: data, widths: keys.map(function (k) { return wide[k] || 17; }) },
        { name: 'Ringkasan', rows: ring, widths: [26, 18, 18, 18, 18, 14, 10] }
      ]);
      saveBlob('VTAG-Export-' + stampName() + '.xlsx', blob);
    }, function (e) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); })
      .finally(function () { btn.disabled = false; btn.innerHTML = ic('download') + ' Download Excel'; });
  };
}

/* ================= v2.3: input kasus massal (foreman) ================= */
var BULK_HEAD = ['VIN', 'Nopol', 'Model', 'Customer Name', 'Jenis Kasus (Electrical/Mechanical)', 'Username Mekanik', 'Failure Date (YYYY-MM-DD, opsional)'];
function bulkTemplate(meks) {
  var ex = meks[0] ? meks[0].username : 'budi';
  return makeXlsx([
    { name: 'Input Kasus', text: true, widths: [24, 14, 12, 24, 30, 20, 26], rows: [BULK_HEAD, ['RLNV4HDG2RH700001', 'B 1234 ABC', 'VF 5', 'Budi Santoso', 'Electrical', ex, ''], ['RLNV4HDG2RH700002', 'B 5678 DEF', 'VF e34', 'Siti Aminah', 'Mechanical', ex, '']] },
    { name: 'Daftar Mekanik', widths: [20, 28, 24], rows: [['Username Mekanik', 'Nama', 'Outlet']].concat(meks.map(function (m) { return [m.username, m.nama, m.outlet]; })) },
    { name: 'Petunjuk', header: false, widths: [100], rows: [['CARA PENGISIAN'], ['1. Isi sheet "Input Kasus" mulai baris 2. Hapus 2 baris contoh.'], ['2. VIN 17 karakter, Jenis Kasus: Electrical atau Mechanical.'], ['3. Username Mekanik lihat sheet "Daftar Mekanik". Boleh dikosongkan jika memilih mekanik default di aplikasi.'], ['4. Simpan file (.xlsx) lalu upload di menu Tugaskan / Input massal.'], ['5. Kasus dibuat sebagai Draft & muncul di HP mekanik. Mekanik tinggal melengkapi data & lampiran lalu Kirim ke Foreman.']] }
  ]);
}
function rowsToBulkText(rowsArr) {
  if (!rowsArr.length) return '';
  var h = rowsArr[0].map(function (x) { return String(x || '').toLowerCase(); });
  var find = function (re, d) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return d; };
  var hasHead = /vin/.test(h[0] || '') || h.some(function (x) { return /nopol|customer/.test(x); });
  var idx = hasHead ? [find(/vin/, 0), find(/nopol|plat/, 1), find(/model/, 2), find(/customer|pelanggan|nama/, 3), find(/jenis|kasus|type/, 4), find(/mekanik|teknisi|username/, 5), find(/failure|tanggal|date/, 6)] : [0, 1, 2, 3, 4, 5, 6];
  return (hasHead ? rowsArr.slice(1) : rowsArr).filter(function (r) { return r.some(function (x) { return String(x || '').trim(); }); }).map(function (r) {
    return idx.map(function (i, j) {
      var v = String(r[i] == null ? '' : r[i]).replace(/[\t\r\n]+/g, ' ').trim();
      if (j === 6 && /^\d{5}(\.\d+)?$/.test(v)) { var d = new Date(Math.round((+v - 25569) * 864e5)); v = d.toISOString().slice(0, 10); }
      return v;
    }).join('\t');
  }).join('\n');
}
function renderBulk(el) {
  el.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>';
  if (!serverAtLeast('2.3')) { el.innerHTML = '<div class="msg warn">' + ic('warn') + '<span>Fitur ini butuh server versi 2.3. Admin: tempel Code.gs terbaru lalu Terapkan versi baru.</span></div>'; return; }
  apiRetry('listMekanik').then(function (meks) {
    el.innerHTML = '<div class="card"><h2><span class="hic num">1</span>Download template</h2><div class="small muted" style="margin:-6px 0 10px">Kolom: <b>VIN, Nopol, Model, Customer Name, Jenis Kasus</b> (Electrical/Mechanical), Username Mekanik, Failure Date (opsional).</div>' +
      '<button class="btn sec block" id="kTpl">' + ic('download') + ' Download template Excel</button></div>' +
      '<div class="card"><h2><span class="hic num">2</span>Upload / tempel data</h2><div class="stack">' +
      '<label class="btn block" style="margin:0">' + ic('upload') + ' Upload file Excel (.xlsx)<input type="file" id="kFile" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none"></label>' +
      '<div><label>atau tempel baris dari Excel / Google Sheets</label><textarea id="kText" style="min-height:150px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;white-space:pre" placeholder="RLNV4HDG2RH700001&#9;B 1234 ABC&#9;VF 5&#9;Budi&#9;Electrical&#9;budi"></textarea><div class="small muted" id="kCnt"></div></div>' +
      '<div><label>Mekanik default (untuk baris yang kolom mekaniknya kosong)</label><select id="kMek"><option value="">— pilih —</option>' + meks.map(function (m) { return '<option value="' + esc(m.username) + '">' + esc(m.nama) + ' (@' + esc(m.username) + (S.user.outlet === '*' || isAdmin() ? ' · ' + esc(m.outlet) : '') + ')</option>'; }).join('') + '</select></div>' +
      '</div></div><div id="kerr" class="msg err hidden"></div><div class="sendbar"><button class="btn or block" id="kGo">' + ic('send') + ' Buat kasus & tugaskan ke mekanik</button></div>';
    var cnt = function () { var n = $('#kText').value.split(/\r?\n/).filter(function (l) { return l.trim() && !/^\s*vin\b/i.test(l); }).length; $('#kCnt').textContent = n ? n + ' baris siap diproses' : ''; };
    $('#kText').oninput = cnt;
    $('#kTpl').onclick = function () { saveBlob('Template-Input-Kasus-VTAG.xlsx', bulkTemplate(meks)); };
    $('#kFile').onchange = function () {
      var f = this.files[0]; this.value = ''; if (!f) return;
      readXlsx(f).then(function (rws) { $('#kText').value = rowsToBulkText(rws); cnt(); toast('File dibaca: ' + $('#kCnt').textContent); })
        .catch(function (e) { toast(errMsg(e), 6000); });
    };
    $('#kGo').onclick = function () {
      var btn = this, er = $('#kerr'); er.classList.add('hidden');
      if (!$('#kText').value.trim()) { er.innerHTML = ic('warn') + '<span>Upload file atau tempel data dulu.</span>'; er.classList.remove('hidden'); return; }
      btn.disabled = true; btn.textContent = 'Memproses…';
      api('bulkCreateCases', $('#kText').value, { mekanik: $('#kMek').value }).then(function (r) {
        bulkCaseResult(r, el); S.rev = null; syncNow();
      }, function (e) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); })
        .finally(function () { if ($('#kGo')) { btn.disabled = false; btn.innerHTML = ic('send') + ' Buat kasus & tugaskan ke mekanik'; } });
    };
  }, function (e) { el.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
}
function bulkCaseResult(r, el) {
  var rowsH = r.results.map(function (x) {
    var cls = x.status === 'ok' ? 'done' : x.status === 'skip' ? 'pending' : 'revisi', icn = x.status === 'ok' ? 'check' : x.status === 'skip' ? 'clock' : 'warn';
    return '<div class="upl row" style="align-items:flex-start"><span class="pill ' + cls + '">' + ic(icn, 'sm') + '</span><div style="flex:1;min-width:0"><b class="mono">' + esc(x.vin || '(kosong)') + '</b> <span class="small muted">' + esc(x.nopol || '') + '</span>' +
      '<div class="small" style="' + (x.status === 'error' ? 'color:var(--bad)' : 'color:var(--muted)') + '">Baris ' + x.baris + ': ' + esc(x.msg) + (x.caseId ? ' · ' + esc(x.caseId) : '') + '</div></div></div>';
  }).join('');
  modal('<h3>Hasil input massal</h3><div class="two" style="margin:12px 0">' + kpi(r.created, 'Kasus dibuat', 'ok', 'check', '') + kpi(r.failed + r.skipped, 'Gagal / dilewati', r.failed || r.skipped ? 'bad' : '', 'warn', '') + '</div>' +
    (r.created ? '<div class="msg ok">' + ic('bell') + '<span>Mekanik mendapat notifikasi. Kasus muncul di HP mereka sebagai <b>Tugas dari foreman</b>.</span></div>' : '') +
    '<div class="sec-t">Rincian</div><div>' + rowsH + '</div><button class="btn sec block" id="kdone" style="margin-top:14px">Selesai</button>', 'narrow');
  $('#kdone').onclick = function () { closeModal(); if (r.created && $('#kText')) { $('#kText').value = ''; $('#kCnt').textContent = ''; } };
}

/* ================= v2.3: campaign ================= */
function campaignsActive() { return ((S.boot && S.boot.campaigns) || []).filter(function (c) { return c.aktif; }); }
function cmpDef(F) {
  var id = F.v.campaignId;
  return ((S.boot && S.boot.campaigns) || []).filter(function (c) { return c.id === id; })[0] || F.cmpDef || null;
}
function cmpItems(def) {
  if (!def) return [];
  return (def.lampiran || []).map(function (a) { return { key: 'cmp_' + def.id + '_' + a.id, label: a.label, grup: 'Dokumen Campaign', kind: a.kind || 'any', wajib: !!a.wajib, hint: a.hint || '' }; });
}
function renderChooser(m, F) {
  var list = campaignsActive();
  m.innerHTML = '<div class="form-wrap"><div class="hero" style="padding:14px 18px"><h1>Input baru</h1><p>Pilih jenis input</p></div>' +
    '<button class="todo chooser" data-c=""><span class="ti" style="background:var(--blue-l);color:var(--blue)">' + ic('shield') + '</span><span class="tt"><b>Kasus VTAG / Warranty</b><span>Electrical / Mechanical · form investigasi lengkap</span></span>' + ic('chev', 'sm') + '</button>' +
    '<div class="small muted" style="margin:14px 2px 8px;font-weight:700">CAMPAIGN AKTIF</div>' +
    list.map(function (c) {
      return '<button class="todo chooser" data-c="' + esc(c.id) + '"><span class="ti" style="background:var(--orange-l);color:var(--orange-d)">' + ic('box') + '</span><span class="tt"><b>' + esc(c.nama) + '</b><span>' + esc(c.deskripsi || ((c.fields || []).length + ' isian · ' + (c.lampiran || []).length + ' dokumen')) + '</span></span>' + ic('chev', 'sm') + '</button>';
    }).join('') + '</div>';
  $$('.chooser', m).forEach(function (b) {
    b.onclick = function () {
      var id = b.dataset.c;
      F.chosen = true;
      if (id) { F.v.caseType = 'Campaign'; F.v.campaignId = id; F.v.cdata = F.v.cdata || {}; }
      else if (F.v.caseType === 'Campaign') { F.v.caseType = ''; F.v.campaignId = ''; }
      Drafts.save(F); renderForm(m);
    };
  });
}
function cfInput(f, val) {
  var id = 'cf_' + f.id, a = ' id="' + id + '" data-cf="' + esc(f.id) + '"';
  if (f.type === 'textarea') return '<textarea' + a + '>' + esc(val) + '</textarea>';
  if (f.type === 'select') return '<select' + a + '><option value="">Pilih…</option>' + (f.options || []).map(function (o) { return '<option' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
  return '<input type="' + (f.type === 'date' ? 'date' : 'text') + '"' + a + (f.type === 'number' ? ' inputmode="decimal"' : '') + ' value="' + esc(val) + '">';
}
function renderCampaignForm(m, F) {
  var v = F.v, b = S.boot, def = cmpDef(F), lockOutlet = !isAdmin() && S.user.outlet !== '*';
  v.cdata = v.cdata || {};
  if (!def) { m.innerHTML = '<div class="form-wrap"><div class="msg err">' + ic('warn') + '<span>Campaign ini sudah tidak aktif / dihapus admin.</span></div><button class="btn sec block" id="fBack">Pilih jenis input lain</button></div>'; $('#fBack').onclick = function () { F.chosen = false; v.caseType = ''; v.campaignId = ''; renderForm(m); }; return; }
  var h = '<div class="form-wrap"><form id="frm" autocomplete="off" novalidate>';
  h += '<div class="hero" style="padding:14px 18px;background:linear-gradient(135deg,var(--orange),var(--orange-d))"><h1>' + esc(def.nama) + '</h1><p>' + (F.editOf ? esc(F.editOf) + ' · ' : '') + 'Input Campaign' + (def.deskripsi ? ' · ' + esc(def.deskripsi) : '') + '</p></div>';
  if (F.note) h += '<div class="msg err">' + ic('undo') + '<span><b>Catatan revisi foreman:</b> ' + esc(F.note) + '</span></div>';
  if (F.state === 'error' && F.err) h += '<div class="msg err">' + ic('warn') + '<span>Pengiriman sebelumnya gagal: ' + esc(F.err) + '</span></div>';
  h += '<div class="savebar" id="saveState">' + ic('check', 'xs') + ' Draft tersimpan otomatis di HP</div>';
  h += '<div class="card"><h2><span class="hic num">1</span>Data kendaraan</h2><div class="stack">' +
    '<div><label>Dealer / Workshop Name <span class="req">*</span></label>' +
    (lockOutlet ? '<input type="text" id="f_outlet" value="' + esc(v.outlet) + '" readonly style="background:var(--gray-bg)">' :
      '<select id="f_outlet"><option value="">Pilih outlet…</option>' + b.outlets.map(function (o) { return '<option' + (v.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>') + '</div>' +
    '<div><label>VIN <span class="req">*</span></label><input type="text" id="f_vin" value="' + esc(v.vin) + '" placeholder="17 karakter" maxlength="17" autocapitalize="characters" autocorrect="off" spellcheck="false" class="mono"><div class="small muted" id="vinc" style="margin-top:4px"></div></div>' +
    '<div class="two"><div><label>Nopol <span class="req">*</span></label><input type="text" id="f_nopol" value="' + esc(v.nopol) + '" placeholder="B 1234 XYZ" autocapitalize="characters"></div>' +
    '<div><label>Model <span class="req">*</span></label><input type="text" id="f_model" list="dlModel" value="' + esc(v.model) + '"><datalist id="dlModel">' + b.models.map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist></div></div>' +
    '<div><label>Customer Name <span class="req">*</span></label><input type="text" id="f_customer" value="' + esc(v.customer) + '"></div></div></div>';
  if ((def.fields || []).length) h += '<div class="card"><h2><span class="hic num">2</span>Data campaign</h2><div class="stack">' + def.fields.map(function (f) {
    return '<div><label>' + esc(f.label) + (f.wajib ? ' <span class="req">*</span>' : ' <span class="opt">(opsional)</span>') + '</label>' + cfInput(f, v.cdata[f.id] || '') + '</div>';
  }).join('') + '</div></div>';
  h += '<div class="card"><h2><span class="hic num or">3</span>Dokumentasi campaign</h2><div class="small muted" style="margin:-4px 0 10px">' + (opt('watermark', true) ? '🕒 Foto & video otomatis diberi watermark tanggal-jam, VIN & Nopol. ' : '') + 'File tersimpan di HP sampai terkirim.</div>' +
    '<div class="small" id="attc" style="font-weight:700"></div><div class="prog"><i id="attp"></i></div><div id="atts"></div></div>';
  h += '<div id="ferr" class="msg err hidden"></div><div class="sendbar"><button class="btn or block" type="submit" id="fSend">' + ic('send') + ' Kirim ke Foreman</button></div>' +
    (isTouch() ? '<button type="button" class="btn sec block" id="fLater" style="margin-top:10px">' + ic('upload') + ' Simpan dulu, lanjut upload file dari laptop</button>' : '') +
    '<button type="button" class="btn sec block" id="fCancel" style="margin-top:10px">Tutup form (draft tetap tersimpan)</button>' +
    (F.editOf ? '' : '<button type="button" class="btn ghost block" id="fSwitch" style="margin-top:4px">Ganti jenis input</button><button type="button" class="btn ghost block" id="fDiscard" style="margin-top:4px;color:var(--bad)">Hapus draft ini</button>') + '</form></div>';
  m.innerHTML = h;
  drawAtts(); vinHint();
  bindFormEvents();
}

/* ---- admin: pembuat campaign ---- */
function renderCampaigns(el) {
  el.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto"></div></div>';
  if (!serverAtLeast('2.3')) { el.innerHTML = '<div class="msg warn">' + ic('warn') + '<span>Fitur campaign butuh server versi 2.3. Tempel Code.gs terbaru lalu Terapkan versi baru.</span></div>'; return; }
  apiRetry('listCampaigns').then(function (list) {
    S.boot.campaigns = list;
    el.innerHTML = '<div class="msg info">' + ic('box') + '<span>Buat form campaign sendiri: nama, isian data & dokumen (foto / video / file) yang diperlukan. Langsung muncul di menu <b>Input</b> mekanik tanpa ubah kode. File masuk folder Drive <b>CAMPAIGN - nama</b>.</span></div>' +
      '<button class="btn or block" id="cNew" style="margin-bottom:12px">' + ic('plus') + ' Buat campaign baru</button>' +
      (list.length ? list.map(function (c, i) {
        return '<button class="todo" data-ci="' + i + '"><span class="ti" style="background:' + (c.aktif ? 'var(--orange-l);color:var(--orange-d)' : 'var(--gray-bg);color:var(--muted)') + '">' + ic('box') + '</span><span class="tt"><b>' + esc(c.nama) + (c.aktif ? '' : ' <span class="tag">nonaktif</span>') + '</b><span>' + (c.fields || []).length + ' isian · ' + (c.lampiran || []).length + ' dokumen · diubah ' + esc(fmtDT(c.updatedAt)) + '</span></span>' + ic('edit', 'sm') + '</button>';
      }).join('') : '<div class="empty">' + ic('box') + '<div>Belum ada campaign.</div></div>');
    $('#cNew').onclick = function () { campaignEditor(null, el); };
    $$('[data-ci]', el).forEach(function (b) { b.onclick = function () { campaignEditor(list[+b.dataset.ci], el); }; });
  }, function (e) { el.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
}
function campaignEditor(c, el) {
  var def = c ? JSON.parse(JSON.stringify(c)) : { nama: '', deskripsi: '', aktif: true, fields: [{ label: 'Nomor Campaign / Recall', type: 'text', wajib: true }], lampiran: [{ label: 'Foto VIN', kind: 'image', wajib: true }, { label: 'Foto sebelum pengerjaan', kind: 'image', wajib: true }, { label: 'Foto sesudah pengerjaan', kind: 'image', wajib: true }] };
  def.fields.forEach(function (f) { if (Array.isArray(f.options)) f.options = f.options.join(', '); });
  var TYPES = [['text', 'Teks singkat'], ['textarea', 'Teks panjang'], ['number', 'Angka'], ['date', 'Tanggal'], ['select', 'Pilihan']];
  var KINDS = [['image', 'Foto'], ['video', 'Video'], ['file', 'File / dokumen'], ['any', 'Bebas']];
  var sel = function (opts, v, attr) { return '<select ' + attr + '>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var grab = function () {
    if (!$('#ceN')) return;
    def.nama = $('#ceN').value; def.deskripsi = $('#ceD').value; def.aktif = $('#ceA').checked;
    $$('[data-fr]').forEach(function (r) { var f = def.fields[+r.dataset.fr]; f.label = r.querySelector('.l').value; f.type = r.querySelector('.t').value; f.wajib = r.querySelector('.w').checked; var o = r.querySelector('.o'); f.options = o ? o.value : f.options; });
    $$('[data-lr]').forEach(function (r) { var a = def.lampiran[+r.dataset.lr]; a.label = r.querySelector('.l').value; a.kind = r.querySelector('.t').value; a.wajib = r.querySelector('.w').checked; a.hint = r.querySelector('.h').value; });
  };
  var draw = function () {
    var h = '<h3>' + (c ? 'Ubah campaign' : 'Campaign baru') + '</h3><div class="stack" style="margin-top:12px">' +
      '<div><label>Nama campaign <span class="req">*</span></label><input type="text" id="ceN" value="' + esc(def.nama) + '" placeholder="Mis. Recall Modul Baterai VF e34"></div>' +
      '<div><label>Keterangan <span class="opt">(opsional)</span></label><input type="text" id="ceD" value="' + esc(def.deskripsi) + '"></div>' +
      '<label class="check"><input type="checkbox" id="ceA"' + (def.aktif ? ' checked' : '') + '> Aktif (tampil di menu Input mekanik)</label></div>' +
      '<div class="sec-t">' + ic('edit') + 'Isian data</div><div class="small muted" style="margin:-4px 0 8px">VIN, Nopol, Model, Customer & Outlet sudah otomatis ada.</div>' +
      def.fields.map(function (f, i) {
        return '<div class="cmprow" data-fr="' + i + '"><input type="text" class="l" value="' + esc(f.label) + '" placeholder="Nama isian">' + sel(TYPES, f.type, 'class="t"') +
          '<label class="sw">Wajib<input type="checkbox" class="w"' + (f.wajib ? ' checked' : '') + '></label><button type="button" class="xbtn" data-fx="' + i + '">Hapus</button>' +
          (f.type === 'select' ? '<input type="text" class="o full" value="' + esc(f.options || '') + '" placeholder="Pilihan dipisah koma, mis. OK, NG, Tidak dicek">' : '') + '</div>';
      }).join('') + '<button type="button" class="btn sec sm" id="ceAF">' + ic('plus', 'sm') + ' Tambah isian</button>' +
      '<div class="sec-t">' + ic('clip') + 'Dokumen yang diperlukan</div>' +
      def.lampiran.map(function (a, i) {
        return '<div class="cmprow" data-lr="' + i + '"><input type="text" class="l" value="' + esc(a.label) + '" placeholder="Nama dokumen, mis. Foto modul">' + sel(KINDS, a.kind, 'class="t"') +
          '<label class="sw">Wajib<input type="checkbox" class="w"' + (a.wajib ? ' checked' : '') + '></label><button type="button" class="xbtn" data-lx="' + i + '">Hapus</button>' +
          '<input type="text" class="h full" value="' + esc(a.hint || '') + '" placeholder="Petunjuk (opsional), mis. Tampak label part"></div>';
      }).join('') + '<button type="button" class="btn sec sm" id="ceAL">' + ic('plus', 'sm') + ' Tambah dokumen</button>' +
      '<div id="ceErr" class="msg err hidden"></div><div class="stack" style="margin-top:16px"><button class="btn or block" id="ceS">' + ic('check') + ' Simpan campaign</button><button class="btn sec block" id="ceX">Batal</button></div>';
    var sc = $('#ov .sheet') ? $('#ov .sheet').scrollTop : 0;
    modal(h);
    if (sc) $('#ov .sheet').scrollTop = sc;
    $('#ceX').onclick = closeModal;
    $('#ceAF').onclick = function () { grab(); def.fields.push({ label: '', type: 'text', wajib: false }); draw(); };
    $('#ceAL').onclick = function () { grab(); def.lampiran.push({ label: '', kind: 'image', wajib: true, hint: '' }); draw(); };
    $$('[data-fx]').forEach(function (b) { b.onclick = function () { grab(); def.fields.splice(+b.dataset.fx, 1); draw(); }; });
    $$('[data-lx]').forEach(function (b) { b.onclick = function () { grab(); def.lampiran.splice(+b.dataset.lx, 1); draw(); }; });
    $$('[data-fr] .t').forEach(function (s) { s.onchange = function () { grab(); draw(); }; });
    $('#ceS').onclick = function () {
      grab();
      var er = $('#ceErr'), btn = this; er.classList.add('hidden');
      if (!def.nama.trim()) { er.innerHTML = ic('warn') + '<span>Nama campaign wajib diisi.</span>'; er.classList.remove('hidden'); return; }
      if (!def.lampiran.some(function (a) { return a.label.trim(); }) && !def.fields.some(function (f) { return f.label.trim(); })) { er.innerHTML = ic('warn') + '<span>Tambahkan minimal satu isian atau dokumen.</span>'; er.classList.remove('hidden'); return; }
      btn.disabled = true; btn.textContent = 'Menyimpan…';
      api('saveCampaign', def).then(function (list) {
        S.boot.campaigns = list; closeModal(); toast('Campaign disimpan & langsung berlaku.'); renderCampaigns(el);
      }, function (e) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); btn.disabled = false; btn.innerHTML = ic('check') + ' Simpan campaign'; });
    };
  };
  draw();
}

/* ================= v2.3: draft otomatis ke server (dipantau foreman & SM) ================= */
var serverDraftSoon = debounce(function () { pushServerDraft(S.form, false); }, 6000);
function pushServerDraft(F, force) {
  if (!F || F.kind !== 'case' || F.state !== 'editing' || !navigator.onLine || !serverAtLeast('2.3') || !canInput()) return;
  if (F.editOf && F.caseStatus && F.caseStatus !== T.DRAFT) return;
  var v = F.v;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(v.vin || '') || !String(v.nopol || '').trim()) return;
  var sig = JSON.stringify(v);
  if (sig === F.srvSig) return;
  if (!force && Date.now() - (F.srvAt || 0) < 20000) { serverDraftSoon(); return; }
  F.srvAt = Date.now();
  if (!F.clientKey) F.clientKey = F.id + '@' + (F.createdAt || Date.now());
  api('saveDraftCase', v, F.caseId || null, F.clientKey).then(function (r) {
    if (r.skipped) return;
    F.caseId = r.caseId; F.srvSig = sig;
    Drafts.save(F);
    var s = $('#saveState'); if (s && S.form === F) s.innerHTML = ic('check', 'xs') + ' Draft tersimpan di HP & server (terlihat foreman)';
  }).catch(function () { /* dicoba lagi saat ada perubahan */ });
}

/* ================= v2.3: push notification (bunyi walau aplikasi ditutup) ================= */
function pushSupported() {
  if (!('serviceWorker' in navigator) || !window.PushManager || !window.Notification) return false;
  if (isIOS() && !(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) && !navigator.standalone) return false;
  return true;
}
function b64uToU8(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function saveAuthMeta() {
  if (!S.token) return DB.del('meta', 'auth').catch(function () {});
  return DB.put('meta', { id: 'auth', token: S.token, api: CONFIG.API_URL, user: S.user ? S.user.username : '' }).catch(function () {});
}
function ensurePush(ask) {
  if (!pushSupported() || !S.boot || !S.boot.vapidPublic || !S.reg && !navigator.serviceWorker) return Promise.resolve(false);
  var perm = ask && Notification.permission === 'default' ? Notification.requestPermission() : Promise.resolve(Notification.permission);
  return perm.then(function (p) {
    if (p !== 'granted') return false;
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        var key = b64uToU8(S.boot.vapidPublic);
        if (sub && sub.options && sub.options.applicationServerKey) {
          var a = new Uint8Array(sub.options.applicationServerKey), same = a.length === key.length && a.every(function (x, i) { return x === key[i]; });
          if (!same) return sub.unsubscribe().then(function () { return null; });
        }
        return sub;
      }).then(function (sub) { return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); });
    }).then(function (sub) {
      var j = sub.toJSON(), mark = 'vt_push_' + S.user.username;
      S.pushOn = true;
      var seenTs = S.events.length ? S.events[0].ts : '';
      DB.get('meta', 'pushSeen').then(function (x) { if (!x || x.ts < seenTs) return DB.put('meta', { id: 'pushSeen', ts: seenTs }); }).catch(function () {});
      saveAuthMeta();
      if (store(mark) === j.endpoint) return true;
      return api('pushSubscribe', { endpoint: j.endpoint, keys: j.keys }, navigator.userAgent.slice(0, 120)).then(function () { store(mark, j.endpoint); return true; });
    });
  }).catch(function (e) { console.warn('push', e); return false; });
}
function pushOff() {
  if (!S.user) return Promise.resolve();
  store('vt_push_' + S.user.username, null); S.pushOn = false;
  if (!('serviceWorker' in navigator)) return Promise.resolve();
  return navigator.serviceWorker.getRegistration().then(function (reg) {
    if (!reg || !reg.pushManager) return;
    return reg.pushManager.getSubscription().then(function (sub) {
      if (!sub) return;
      var ep = sub.endpoint;
      return api('pushUnsubscribe', ep).catch(function () {}).then(function () { return sub.unsubscribe(); });
    });
  }).catch(function () {}).then(function () { return DB.del('meta', 'auth').catch(function () {}); });
}
function pushBanner() {
  if (!S.boot || !S.boot.vapidPublic || !window.Notification) return '';
  if (pushSupported() && Notification.permission === 'default') return '<div class="msg info" id="pushAsk">' + ic('bell') + '<span><b>Aktifkan notifikasi bunyi di HP</b> supaya tetap tahu ada kasus baru / hasil validasi walau aplikasi ditutup. <button class="btn sm or" id="pushGo" style="margin-top:8px">Aktifkan notifikasi</button></span></div>';
  if (pushSupported() && Notification.permission === 'denied') return '<div class="msg warn">' + ic('bell') + '<span>Notifikasi diblokir. Buka <b>Setelan HP → Aplikasi → VTAG Otoklix → Notifikasi</b> lalu izinkan.</span></div>';
  if (isIOS() && !pushSupported()) return '<div class="msg info">' + ic('bell') + '<span>iPhone: agar notifikasi berbunyi, buka di Safari → Bagikan → <b>Tambah ke Layar Utama</b>, lalu buka dari ikon tersebut.</span></div>';
  return '';
}
function bindPushBanner(root) {
  var b = $('#pushGo', root);
  if (b) b.onclick = function () { b.disabled = true; ensurePush(true).then(function (ok) { toast(ok ? '🔔 Notifikasi HP aktif.' : 'Notifikasi tidak diizinkan.'); renderView(); }); };
}

/* ================= service worker & update otomatis ================= */
function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    S.reg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) onUpdateReady(true);
    reg.addEventListener('updatefound', function () {
      var w = reg.installing;
      if (w) w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) onUpdateReady(false); });
    });
    setInterval(function () { reg.update().catch(function () {}); }, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
  }).catch(function () {});
  // muat ulang hanya saat update diterapkan (bukan saat service worker pertama kali aktif)
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloading || !S.updateRequested) return;
    reloading = true; location.reload();
  });
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (!e.data) return;
    if (e.data.type === 'open-case' && S.user && e.data.caseId) { S.rev = null; syncNow(); openCase(e.data.caseId); }
    if (e.data.type === 'sync' && S.user) syncNow();
  });
}
function onUpdateReady(atStart) {
  S.updateReady = true;
  if (atStart || !busy()) { applyUpdate(); return; }
  renderNetbar();
}
function applyUpdate() {
  flushForm();
  S.updateRequested = true;
  if (S.reg && S.reg.waiting) S.reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  else location.reload();
}
