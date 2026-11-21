/* DIBUAT OTOMATIS oleh gen_dash.js dari app.js + ts.js — jangan diedit manual. */
'use strict';
var CONFIG = { API_URL: "https://script.google.com/macros/s/AKfycbyGcLEZZ2Xm0nYl2gq53Qng-KmOUYSqvCrlwtAfRrxROwIREyGL3JyG9CQPlT_9QBYq1Q/exec", REFRESH_MS: 60000 };
var IC = {
 "list": "<line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><line x1=\"3\" y1=\"6\" x2=\"3.01\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"3.01\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"3.01\" y2=\"18\"/>",
 "check": "<path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"/><polyline points=\"22 4 12 14.01 9 11.01\"/>",
 "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>",
 "box": "<path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><polyline points=\"3.27 6.96 12 12.01 20.73 6.96\"/><line x1=\"12\" y1=\"22.08\" x2=\"12\" y2=\"12\"/>",
 "x": "<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/>",
 "zap": "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/>",
 "car": "<path d=\"M5 17H3v-4l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v4h-2\"/><path d=\"M3 13h18\"/><circle cx=\"7.5\" cy=\"17\" r=\"1.8\"/><circle cx=\"16.5\" cy=\"17\" r=\"1.8\"/>",
 "tool": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>",
 "pin": "<path d=\"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>",
 "warn": "<path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>",
 "printer": "<polyline points=\"6 9 6 2 18 2 18 9\"/><path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\"/>",
 "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/>"
};
function $(s, r) { return (r || document).querySelector(s); }
function ic(n, c) { return '<svg class="i ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtDate(s) { if (!s) return '-'; var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : s; }
function kpi(n, l, c, i, f) { return '<button class="kpi ' + c + '" data-f="' + esc(f) + '"><div class="ic">' + ic(i, 'lg') + '</div><div><div class="n">' + n + '</div><div class="l">' + esc(l) + '</div></div></button>'; }
function tsStClass(st) { return st === 'Baru' ? 'tsnew' : st === 'Analysis' ? 'pending' : st === 'Pending part' ? 'after' : st === 'Resolved' ? 'done' : st === 'Not resolved' ? 'revisi' : 'sub'; }
function tsPill(st) { return '<span class="pill ' + tsStClass(st) + '">' + esc(st || '-') + '</span>'; }
function tsVeh(r) { return [r.brand || r.Brand, r.model || r.Model].filter(Boolean).join(' ') || 'Kendaraan'; }
function tsDonut(parts, total) {
  var r = 52, c = 2 * Math.PI * r, off = 0;
  var segs = parts.filter(function (p) { return p.n; }).map(function (p) {
    var len = c * p.n / (total || 1);
    var s = '<circle r="' + r + '" cx="70" cy="70" fill="none" stroke="' + p.c + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"><title>' + esc(p.l + ': ' + p.n) + '</title></circle>';
    off += len; return s;
  }).join('');
  return '<svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Status kasus">' + (total ? segs : '<circle r="52" cx="70" cy="70" fill="none" stroke="#eef0f5" stroke-width="22"/>') +
    '<text x="70" y="66" text-anchor="middle" font-size="24" font-weight="800" fill="#16203a">' + total + '</text><text x="70" y="84" text-anchor="middle" font-size="11" fill="#6b7488">kasus</text></svg>';
}
function tsBars(obj, color, max) {
  var ks = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).slice(0, max || 8);
  if (!ks.length) return '<div class="muted small">Belum ada data.</div>';
  var top = obj[ks[0]] || 1;
  return ks.map(function (k) { return '<div class="hbar"><span class="hl">' + esc(k) + '</span><span class="ht"><i style="width:' + (obj[k] / top * 100).toFixed(1) + '%;background:' + color + '"></i></span><b>' + obj[k] + '</b></div>'; }).join('');
}
function tsMins(a, b) {
  var p = function (s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : NaN; };
  var x = (p(b) - p(a)) / 60000; return x >= 0 ? x : NaN;
}
function tsFmtMins(x) { if (!(x >= 0)) return '-'; if (x < 1) return '< 1 mnt'; if (x < 60) return Math.round(x) + ' mnt'; if (x < 1440) return (x / 60).toFixed(1).replace('.', ',') + ' jam'; return (x / 1440).toFixed(1).replace('.', ',') + ' hari'; }
var DASH = { range: 'all', brand: '', list: [] };
function tsRenderDash(m) {
  var D = DASH, now = new Date();
  var from = D.range === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : D.range === '3m' ? new Date(now.getFullYear(), now.getMonth() - 2, 1) : D.range === 'year' ? new Date(now.getFullYear(), 0, 1) : null;
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var list = DASH.list.filter(function (r) { return (!from || r.ts >= iso(from)) && (!D.brand || r.brand === D.brand); });
  var by = function (st) { return list.filter(function (r) { return r.status === st; }).length; };
  var tot = list.length, res = by('Resolved'), ana = by('Analysis') + by('Baru'), part = by('Pending part'), not = by('Not resolved') + by('Dirujuk ke dealer');
  var brands = {}; DASH.list.forEach(function (r) { if (r.brand) brands[r.brand] = 1; });
  var h = '<div class="tshead"><div><h1>Dashboard Technical Issue</h1><div class="small muted">' + (D.brand ? esc(D.brand) + ' · ' : '') + tot + ' kasus</div></div></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap"><select class="slim" id="dr">' + [['all', 'Semua waktu'], ['month', 'Bulan ini'], ['3m', '3 bulan'], ['year', 'Tahun ini']].map(function (x) { return '<option value="' + x[0] + '"' + (D.range === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
    '<select class="slim" id="db"><option value="">Semua merek</option>' + Object.keys(brands).sort().map(function (b) { return '<option' + (D.brand === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select></div>';
  h += '<div class="kpis five">' + kpi(tot, 'Total Issue', '', 'list', '') + kpi(res, 'Resolved', 'ok', 'check', 'Resolved') + kpi(ana, 'Analysis', 'warn', 'clock', 'Analysis') + kpi(part, 'Pending Part', 'sub', 'box', 'Pending part') + kpi(not, 'Not Resolved', 'bad', 'x', 'Not resolved') + '</div>';
  var resp = [], hand = [];
  list.forEach(function (r) { if (r.src === 'Google Form') return; if (r.src === 'Aplikasi' && r.resp) resp.push(tsMins(r.ts, r.resp)); if (r.done && r.src === 'Aplikasi') hand.push(tsMins(r.ts, r.done)); });
  var avg = function (a) { a = a.filter(function (x) { return x >= 0; }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : NaN; };
  h += '<div class="deskgrid"><div>';
  h += '<div class="card"><h2><span class="hic or">' + ic('zap') + '</span>Status kasus</h2><div class="row" style="gap:16px;flex-wrap:wrap">' + tsDonut([{ l: 'Resolved', n: res, c: '#2fa57d' }, { l: 'Analysis', n: ana, c: '#ffb02e' }, { l: 'Pending part', n: part, c: '#7c4dff' }, { l: 'Not resolved', n: not, c: '#e5675c' }], tot) +
    '<div class="small" style="flex:1;min-width:140px">' + [['Resolved', res, '#2fa57d'], ['Analysis', ana, '#ffb02e'], ['Pending part', part, '#7c4dff'], ['Not resolved / dealer', not, '#e5675c']].map(function (x) { return '<div class="row" style="gap:8px;margin:5px 0"><i style="width:10px;height:10px;border-radius:3px;background:' + x[2] + ';display:inline-block"></i><span style="flex:1">' + x[0] + '</span><b>' + x[1] + '</b><span class="muted">' + (tot ? Math.round(x[1] / tot * 100) : 0) + '%</span></div>'; }).join('') +
    '<div class="muted" style="margin-top:10px">Dari permintaan lewat aplikasi:<br>Respon pertama rata-rata: <b>' + tsFmtMins(avg(resp)) + '</b><br>Sampai selesai rata-rata: <b>' + tsFmtMins(avg(hand)) + '</b></div></div></div></div>';
  var cb = {}, cs = {}, cd = {}, co = {};
  list.forEach(function (r) { cb[r.brand || '-'] = (cb[r.brand || '-'] || 0) + 1; if (r.sistem) cs[r.sistem] = (cs[r.sistem] || 0) + 1; co[r.outlet || '-'] = (co[r.outlet || '-'] || 0) + 1; String(r.dtc || '').split(/,\s*/).filter(Boolean).forEach(function (x) { cd[x] = (cd[x] || 0) + 1; }); });
  h += '<div class="card"><h2><span class="hic">' + ic('car') + '</span>Per merek</h2>' + tsBars(cb, '#002eb4') + '</div>';
  h += '<div class="card"><h2><span class="hic">' + ic('tool') + '</span>Per sistem</h2>' + tsBars(cs, '#ff6400') + '</div></div><div>';
  h += '<div class="card"><h2><span class="hic">' + ic('pin') + '</span>Per outlet</h2>' + tsBars(co, '#0f8a5f') + '</div>';
  h += '<div class="card"><h2><span class="hic">' + ic('warn') + '</span>Kode DTC terbanyak</h2>' + tsBars(cd, '#c2271b', 10) + '</div></div></div>';

  h += '<div class="card"><h2><span class="hic">' + ic('clock') + '</span>Recent Issues</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>No.</th><th>Kendaraan</th><th>Nopol</th><th>Outlet</th><th>Issue</th><th>Status</th><th>PDF</th></tr></thead><tbody>' +
    (list.length ? list.slice(0, 25).map(function (r) {
      return '<tr><td>' + esc(fmtDate(r.ts)) + '</td><td class="mono">' + esc(r.no || r.id) + '</td><td>' + esc(tsVeh(r)) + '</td><td>' + esc(r.nopol) + '</td><td>' + esc(r.outlet) + '</td><td style="white-space:normal;min-width:180px">' + esc(String(r.keluhan || '').slice(0, 90)) + '</td><td>' + tsPill(r.status) + '</td><td>' + pdfBtn(r) + '</td></tr>';
    }).join('') : '<tr><td colspan="8" class="muted">Belum ada data.</td></tr>') + '</tbody></table></div></div>';
  m.innerHTML = h;
  Array.prototype.forEach.call(m.querySelectorAll('[data-pdf]'), function (b) { b.onclick = function () { dashPdf(b.dataset.pdf, b); }; });
  $('#dr').onchange = function () { D.range = this.value; tsRenderDash(m); };
  $('#db').onchange = function () { D.brand = this.value; tsRenderDash(m); };
}

/* ---------------- PDF report ---------------- */
var PDFS = {};   // id -> { upd, name, url(blob) } : dipakai ulang selama kasus tidak berubah
function pdfBtn(r) {
  var c = PDFS[r.id]; var ok = c && c.upd === (r.upd || '');
  return '<button class="btn sec sm" type="button" data-pdf="' + esc(r.id) + '" title="' + (ok ? 'Unduh PDF report' : 'Buat & unduh PDF report') + '">' + ic(ok ? 'download' : 'printer', 'sm') + '</button>';
}
function saveUrl(name, url) { var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function b64Blob(b64) { var bin = atob(b64), n = bin.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: 'application/pdf' }); }
function dashPdf(id, btn) {
  var row = DASH.list.filter(function (r) { return r.id === id; })[0], c = PDFS[id];
  if (c && row && c.upd === (row.upd || '')) { saveUrl(c.name, c.url); setInfo('Mengunduh ' + c.name); return; }
  btn.disabled = true; btn.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:3px;display:inline-block;vertical-align:-3px"></span>';
  setInfo('Menyiapkan PDF report… biasanya 10–30 detik.');
  fetch(API + (API.indexOf('?') < 0 ? '?' : '&') + 'page=dashpdf&key=' + encodeURIComponent(KEY) + '&id=' + encodeURIComponent(id), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'Gagal membuat PDF.');
      var url = URL.createObjectURL(b64Blob(j.b64));
      PDFS[id] = { upd: row ? (row.upd || '') : '', name: j.name, url: url };
      saveUrl(j.name, url); setInfo('PDF siap: ' + j.name);
    })
    .catch(function (e) { setInfo('PDF gagal: ' + (e.message || e), true); })
    .then(function () { var cur = document.querySelector('[data-pdf="' + id + '"]'); if (!cur) return; cur.outerHTML = pdfBtn(row || { id: id }); var nb = document.querySelector('[data-pdf="' + id + '"]'); if (nb) nb.onclick = function () { dashPdf(id, nb); }; });
}

/* ---------------- pengambilan data realtime ---------------- */
var qs = new URLSearchParams(location.search);
var KEY = qs.get('k') || qs.get('key') || '', API = qs.get('api') || CONFIG.API_URL;
function stamp(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2); }
function setInfo(t, bad) { var e = $('#dInfo'); if (e) { e.textContent = t; e.className = 'small ' + (bad ? 'dbad' : 'muted'); } }
function load(manual) {
  if (!KEY) { $('#dMain').innerHTML = '<div class="msg err">Kunci dashboard belum ada di alamat ini. Ambil alamat lengkapnya dari app: Tech Support › Pengaturan › Dashboard publik.</div>'; return; }
  setInfo('Memuat…');
  return fetch(API + (API.indexOf('?') < 0 ? '?' : '&') + 'page=dashdata&key=' + encodeURIComponent(KEY) + '&_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'Gagal memuat data.');
      DASH.list = j.rows || [];
      tsRenderDash($('#dMain'));
      setInfo('Diperbarui ' + stamp(new Date()) + ' · otomatis tiap 1 menit');
    })
    .catch(function (e) {
      if (!DASH.list.length) $('#dMain').innerHTML = '<div class="msg err">' + esc(e.message || e) + '</div>';
      setInfo('Gagal memperbarui (' + (e.message || e) + '). Mencoba lagi…', true);
    });
}
document.addEventListener('DOMContentLoaded', function () {
  $('#dRef').onclick = function () { load(true); };
  load();
  setInterval(function () { if (!document.hidden) load(); }, CONFIG.REFRESH_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
});
