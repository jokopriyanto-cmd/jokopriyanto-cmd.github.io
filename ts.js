/* Otoklix Workshop Investigation – aplikasi TECH SUPPORT (multi-brand)
 * Berjalan di dalam aplikasi yang sama (satu akun), tetapi datanya terpisah dari VTAG:
 * semua panggilan memakai API ts* yang menyimpan ke spreadsheet "TECHNICAL SUPPORT DB".
 */
'use strict';

var TSA = {
  boot: null, list: [], events: [], rev: null, loading: null, err: '',
  inbox: 'bantuan', ifilter: '', filter: { q: '', status: '', brand: '', outlet: '' },
  dash: { range: 'all', brand: '' }, caseId: null, caseData: null, back: 'ts:home',
  thumbs: {}, form: null, rec: null, uploading: 0, simT: null
};
IC.phone = '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>';
IC.wa = '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>';
var TS_ST_ORDER = ['Baru', 'Analysis', 'Pending part', 'Resolved', 'Not resolved', 'Dirujuk ke dealer'];
var TS_INFO = 'Gunakan Aplikasi VTAG warranty untuk Khusus Vinfast. Gunakan Aplikasi Tech Support untuk problem semua brand yang di tangani di bengkel di luar warranty ATPM.';

/* ---------------- akses & status ---------------- */
function tsAccess() { return !!(S.boot && S.boot.ts && S.boot.ts.access); }
function inTs() { return S.app === 'ts'; }
function tsReq() { return role() === 'mekanik' || role() === 'mekanik_sw'; }
function tsStaff() { return TSA.boot ? !!TSA.boot.me.staff : !!(S.boot && S.boot.ts && S.boot.ts.staff); }
function tsCfg() { return (TSA.boot && TSA.boot.cfg) || { brands: [], systems: [], urgent: {}, ai: {}, team: [], open: ['Baru', 'Analysis', 'Pending part'], final: ['Resolved', 'Not resolved', 'Dirujuk ke dealer'] }; }
function tsIsOpen(st) { return tsCfg().open.indexOf(st) >= 0; }
function tsIsFinal(st) { return tsCfg().final.indexOf(st) >= 0; }
function tsFormOpen() { return S.tab === 'ts:new' || S.tab === 'ts:record'; }
function tsBusy() { return tsFormOpen() || TSA.uploading > 0 || (TSA.q && TSA.q.length > 0); }
function tsStClass(st) { return st === 'Baru' ? 'tsnew' : st === 'Analysis' ? 'pending' : st === 'Pending part' ? 'after' : st === 'Resolved' ? 'done' : st === 'Not resolved' ? 'revisi' : 'sub'; }
function tsPill(st) { return '<span class="pill ' + tsStClass(st) + '">' + esc(st || '-') + '</span>'; }
function tsVeh(r) { return [r.brand || r.Brand, r.model || r.Model].filter(Boolean).join(' ') || 'Kendaraan'; }
function tsHome() { return tsStaff() ? 'ts:inbox' : 'ts:home'; }
function tsUrgentOpen() { return TSA.list.filter(function (r) { return r.urgent && tsIsOpen(r.status); }); }
function tsNewCount() { return TSA.list.filter(function (r) { return r.status === 'Baru'; }).length; }
function tsMineOpen() { return TSA.list.filter(function (r) { return r.tuser === S.user.username && tsIsOpen(r.status); }); }

/* ---------------- pindah aplikasi ---------------- */
function tsAppKey() { return 'vt_app_' + (S.user ? S.user.username : ''); }
function tsInitApp() {
  if (!tsAccess()) { S.app = 'vtag'; if (String(S.tab).indexOf('ts:') === 0) S.tab = 'home'; return; }
  if (!S.app) S.app = store(tsAppKey()) === 'ts' ? 'ts' : 'vtag';
  if (!window.vtagAvail || !vtagAvail()) S.app = 'ts';   // admin mematikan semua fitur VTAG untuk outlet ini
  if (S.app === 'ts' && String(S.tab).indexOf('ts:') !== 0) S.tab = tsHome();
  if (S.app === 'vtag' && String(S.tab).indexOf('ts:') === 0) S.tab = 'home';
}
function tsSwitch(app) {
  if (app === S.app) { store(tsAppKey(), app); closeModal(); return; }
  if (S.tab === 'input') flushForm();
  S.app = app; store(tsAppKey(), app);
  closeModal();
  if (app === 'ts') { S.tab = tsHome(); if (!TSA.boot) tsLoad(); }
  else S.tab = 'home';
  renderApsw(); renderNav(); renderView(); renderBell(); window.scrollTo(0, 0);
}
function renderApsw() {
  var b = $('#appbar');
  if (!b) return;
  if (!tsAccess() || (window.vtagAvail && !vtagAvail())) { b.classList.add('hidden'); b.innerHTML = ''; document.body.classList.remove('hasapp'); return; }
  b.classList.remove('hidden'); document.body.classList.add('hasapp');
  var hd = $('header.top'); if (hd && hd.offsetHeight) document.documentElement.style.setProperty('--hdr-h', (hd.offsetHeight - 1) + 'px');
  var n = TSA.list.filter(function (r) { return tsStaff() ? r.status === 'Baru' || (r.urgent && tsIsOpen(r.status)) : r.tuser === S.user.username && tsIsOpen(r.status); }).length;
  b.innerHTML = '<div class="appseg" role="tablist" aria-label="Pilih aplikasi">' +
    '<button role="tab" data-app="vtag" class="vt' + (inTs() ? '' : ' on') + '" aria-selected="' + !inTs() + '">' + ic('shield') + '<span><b>VTAG Warranty</b><small>Khusus VinFast</small></span></button>' +
    '<button role="tab" data-app="ts" class="ts' + (inTs() ? ' on' : '') + '" aria-selected="' + inTs() + '">' + ic('tool') + '<span><b>Tech Support</b><small>Semua merek</small></span>' + (n && !inTs() ? '<em>' + n + '</em>' : '') + '</button></div>';
  $$('[data-app]', b).forEach(function (x) { x.onclick = function () { tsSwitch(x.dataset.app); }; });
  if (b.offsetHeight) document.documentElement.style.setProperty('--app-h', b.offsetHeight + 'px');
}
function tsChooser(first) {
  var u = S.user;
  modal('<h3>' + (first ? 'Halo, ' + esc(String(u.nama).split(' ')[0]) : 'Pilih aplikasi') + '</h3><div class="muted small" style="margin:4px 0 14px">' + esc(roleName(u.role)) + ' · ' + (u.outlet === '*' ? 'Semua outlet' : esc(u.outlet)) + '. Mau buka aplikasi apa?</div>' +
    '<button class="appcard vt' + (inTs() ? '' : ' on') + '" data-app="vtag"><span class="ac-ic">' + ic('shield', 'lg') + '</span><span class="ac-t"><b>VTAG Warranty</b><small>Khusus VinFast</small><span>Investigasi warranty, pengajuan VTAG, campaign, dan eskalasi.</span></span></button>' +
    '<button class="appcard ts' + (inTs() ? ' on' : '') + '" data-app="ts"><span class="ac-ic">' + ic('tool', 'lg') + '</span><span class="ac-t"><b>Tech Support</b><small>Semua merek</small><span>Minta bantuan troubleshooting ke Technical Support. Ada saran awal, tombol WhatsApp untuk kasus urgent, dan PDF report.</span></span></button>' +
    '<div class="msg info" style="margin-top:12px">' + ic('warn') + '<span>' + esc(TS_INFO) + '</span></div>' +
    '<div class="small muted" style="text-align:center;margin-top:8px">Satu akun untuk dua aplikasi. Data keduanya terpisah. Ganti aplikasi kapan saja lewat tombol VTAG Warranty / Tech Support di bagian atas.</div>', 'narrow');
  $$('[data-app]').forEach(function (b) { b.onclick = function () { tsSwitch(b.dataset.app); }; });
}

/* ---------------- data ---------------- */
function tsLoad(force) {
  if (!tsAccess()) return Promise.resolve();
  if (TSA.loading && !force) return TSA.loading;
  TSA.loading = apiRetry('tsBoot').then(function (b) {
    TSA.boot = b; TSA.list = b.list || []; TSA.events = b.events || []; TSA.rev = b.rev; TSA.err = '';
    try { store('vt_tsboot_' + S.user.username, JSON.stringify(b)); } catch (e) { /* */ }
    tsNotifyNew(true); renderApsw();
    if (inTs()) { if (S.tab === 'ts:home' && tsStaff()) S.tab = 'ts:inbox'; renderNav(); if (!tsFormOpen() && S.tab !== 'ts:case') renderView(); }
    renderBell();
  }, function (e) {
    TSA.err = errMsg(e);
    if (inTs() && !TSA.boot) renderView();
  }).finally(function () { TSA.loading = null; });
  return TSA.loading;
}
function tsReset() { document.body.classList.remove('hasapp'); TSA.boot = null; TSA.list = []; TSA.events = []; TSA.rev = null; TSA.form = null; TSA.rec = null; TSA.caseId = null; TSA.caseData = null; TSA.thumbs = {}; TSA.owner = null; S.techNames = null; }
function tsCached() {
  if (!S.user) return;
  if (TSA.owner && TSA.owner !== S.user.username) { tsReset(); S.app = null; }
  TSA.owner = S.user.username;
  if (TSA.boot) return;
  try { var c = store('vt_tsboot_' + S.user.username); if (c) { var b = JSON.parse(c); TSA.boot = b; TSA.list = b.list || []; TSA.events = b.events || []; TSA.rev = null; } } catch (e) { /* */ }
}
/** Dipanggil dari sync VTAG: info revisi Tech Support. */
var tsTickAt = 0;
function tsOnInfo(info) {
  if (!info) return;
  // balasan otomatis AI yang sudah jatuh tempo: diproses oleh aplikasi yang sedang terbuka
  if (info.access && info.autoDue && info.now && info.autoDue <= info.now && Date.now() - tsTickAt > 30000) {
    tsTickAt = Date.now();
    api('tsAutoTick').then(function (r) { if (r && r.done) tsSyncNow(); }).catch(function () { /* dicoba lagi */ });
  }
  var had = S.boot.ts && S.boot.ts.access;
  S.boot.ts = info;
  if (!info.access) { if (inTs()) tsSwitch('vtag'); renderApsw(); return; }
  if (!had) renderApsw();
  if (!TSA.boot) { if (inTs() || info.rev !== '0') tsLoad(); return; }
  if (info.rev && info.rev !== TSA.rev) tsSyncNow();
}
var tsSyncing = false;
function tsSyncNow() {
  if (tsSyncing || !TSA.boot) return Promise.resolve();
  tsSyncing = true;
  return api('tsSync', TSA.rev).then(function (r) {
    if (r.same) return false;
    TSA.rev = r.rev; TSA.list = r.list || []; TSA.events = r.events || [];
    if (r.cfg) TSA.boot.cfg = r.cfg;
    if (r.me) TSA.boot.me = r.me;
    TSA.boot.list = TSA.list; TSA.boot.events = TSA.events; TSA.boot.rev = TSA.rev;
    try { store('vt_tsboot_' + S.user.username, JSON.stringify(TSA.boot)); } catch (e) { /* */ }
    tsNotifyNew(false);
    renderBell(); renderApsw();
    if (inTs()) {
      renderNav();
      if (S.tab === 'ts:case' && TSA.caseId) tsRefreshCase();
      else if (!tsFormOpen() && !$('#ov')) renderView();
    }
    return true;
  }).catch(function () { /* dicoba lagi */ }).finally(function () { tsSyncing = false; });
}
function tsNotifyNew(silent) {
  var key = 'vt_tsnotified_' + S.user.username, last = store(key);
  var ev = TSA.events;
  if (ev.length) store(key, ev[0].ts);
  if (silent && !last) return;
  var fresh = ev.filter(function (e) { return !last || e.ts > last; });
  if (!last || !fresh.length) return;
  toast('🔔 ' + fresh[0].message, 6000);
  if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (x) { /* */ }
  if (!S.pushOn && window.Notification && Notification.permission === 'granted' && document.visibilityState !== 'visible' && S.reg) {
    fresh.slice(0, 3).forEach(function (x) { S.reg.showNotification('Tech Support Otoklix', { body: x.message, icon: 'icons/icon-192-v2.png', badge: 'icons/icon-192-v2.png', tag: 'ts-' + x.caseId + '-' + x.type, data: { caseId: x.caseId } }); });
  }
}

/* ---------------- navigasi ---------------- */
function tsTabsDef() {
  var t = [];
  if (tsStaff()) {
    var n = TSA.list.filter(function (r) { return r.status === 'Baru' || (r.urgent && tsIsOpen(r.status)); }).length;
    t.push({ k: 'ts:inbox', l: 'Kotak masuk', i: 'inbox', n: n });
    t.push({ k: 'ts:record', l: 'Catat', i: 'plus', cta: true });
    t.push({ k: 'ts:data', l: 'Data', i: 'list' });
    t.push({ k: 'ts:dash', l: 'Dashboard', i: 'zap' });
    if (isAdmin()) t.push({ k: 'ts:admin', l: 'Atur', i: 'gear' });
  } else {
    t.push({ k: 'ts:home', l: 'Beranda', i: 'home' });
    t.push({ k: 'ts:new', l: 'Minta bantuan', i: 'plus', cta: true });
    t.push({ k: 'ts:data', l: tsReq() ? 'Kasus' : 'Data', i: 'list', n: tsMineOpen().length });
    if (role() === 'sm' || role() === 'foreman' || role() === 'foreman_sw') t.push({ k: 'ts:dash', l: 'Dashboard', i: 'zap' });
  }
  return t;
}
function tsRender(m) {
  document.body.classList.add('tsmode');
  if (!TSA.boot) {
    if (TSA.err) { m.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(TSA.err) + '</span></div><button class="btn block" id="tsRetry">' + ic('refresh') + ' Coba lagi</button>'; $('#tsRetry').onclick = function () { TSA.err = ''; tsRender(m); tsLoad(true); }; return; }
    m.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto 10px"></div>Memuat Tech Support…</div>';
    tsLoad(); return;
  }
  var k = S.tab;
  if (k === 'ts:inbox' && !tsStaff()) k = S.tab = 'ts:home';
  if (k === 'ts:record' && !tsStaff()) k = S.tab = 'ts:new';
  if (k === 'ts:admin' && !isAdmin()) k = S.tab = tsHome();
  if (k === 'ts:home') return tsRenderHome(m);
  if (k === 'ts:inbox') return tsRenderInbox(m);
  if (k === 'ts:new') return tsRenderForm(m);
  if (k === 'ts:record') return tsRenderRecord(m);
  if (k === 'ts:data') return tsRenderData(m);
  if (k === 'ts:dash') return tsRenderDash(m);
  if (k === 'ts:case') return tsRenderCase(m);
  if (k === 'ts:admin') { m.innerHTML = '<div class="hero ts"><h1>Pengaturan Tech Support</h1><p>Akun admin · berlaku langsung, tanpa ubah kode</p></div><div id="tsadm"></div>'; return renderTsAdmin($('#tsadm')); }
  S.tab = tsHome(); tsRender(m);
}

/* ---------------- kartu kasus ---------------- */
function tsCard(r, opts) {
  opts = opts || {};
  var age = r.status === 'Baru' ? ago(r.ts) : fmtDate(r.ts);
  return '<div class="tscase ' + tsStClass(r.status) + (r.urgent && tsIsOpen(r.status) ? ' urgent' : '') + '" data-ts="' + esc(r.id) + '" role="button" tabindex="0">' +
    '<div class="r1"><span class="row" style="gap:6px;flex-wrap:wrap">' + (r.urgent && tsIsOpen(r.status) ? '<span class="pill urg">URGENT</span>' : '') + tsPill(r.status) + '<span class="small muted">' + esc(age) + '</span></span><span class="small muted mono">' + esc(r.id) + '</span></div>' +
    '<div class="r2"><b>' + esc(tsVeh(r)) + '</b>' + (r.nopol ? ' · ' + esc(r.nopol) : '') + '</div>' +
    '<div class="r3">' + [r.sistem, r.dtc, r.outlet, r.teknisi ? 'dari ' + r.teknisi : ''].filter(Boolean).map(esc).join(' · ') + '</div>' +
    (opts.full !== false ? '<div class="r4">' + esc(r.keluhan) + '</div>' : '') +
    (r.hname && opts.handler !== false ? '<div class="small muted" style="margin-top:4px">' + ic('user', 'xs') + ' ' + esc(r.hname) + (r.src && r.src !== 'Aplikasi' ? ' · ' + esc(r.src) : '') + '</div>' : '') +
    (opts.take && tsIsOpen(r.status) && r.handler !== S.user.username ? '<div class="row" style="margin-top:8px"><button class="btn or sm" data-take="' + esc(r.id) + '">Tangani</button><button class="btn sec sm" data-open="' + esc(r.id) + '">Lihat</button></div>' : '') +
    '</div>';
}
function tsBindCards(root) {
  $$('[data-ts]', root).forEach(function (c) {
    c.onclick = function (e) { if (e.target.closest('[data-take]')) return; tsOpen(c.dataset.ts); };
    c.onkeydown = function (e) { if (e.key === 'Enter') tsOpen(c.dataset.ts); };
  });
  $$('[data-take]', root).forEach(function (b) {
    b.onclick = function (e) {
      e.stopPropagation(); b.disabled = true;
      api('tsTake', b.dataset.take).then(function () { toast('Kasus Anda tangani.'); tsOpen(b.dataset.take); tsSyncNow(); }, function (er) { b.disabled = false; toast(errMsg(er)); });
    };
  });
}

/* ---------------- beranda teknisi ---------------- */
function tsRenderHome(m) {
  var u = S.user, mine = TSA.list.filter(function (r) { return r.tuser === u.username; });
  var open = mine.filter(function (r) { return tsIsOpen(r.status); });
  var outletOpen = TSA.list.filter(function (r) { return r.tuser !== u.username && tsIsOpen(r.status); });
  var h = '<div class="hero ts"><h1>Tech Support</h1><p>' + esc(String(u.nama).split(' ')[0]) + ' · ' + esc(roleName(u.role)) + ' · semua merek, di luar warranty ATPM</p><div class="acts">' +
    '<button class="btn white" data-go="ts:new">' + ic('plus') + ' Minta bantuan</button>' +
    (!tsReq() ? '<button class="btn sec" data-go="ts:dash" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.4)">' + ic('zap') + ' Dashboard</button>' : '') + '</div></div>';
  h += pushBanner();
  var team = tsCfg().team;
  if (team.length) h += '<div class="card"><h2><span class="hic or">' + ic('users') + '</span>Tim Technical Support</h2>' + team.map(function (t) {
    return '<div class="row" style="padding:6px 0"><span class="avatar" style="background:var(--orange-d);width:34px;height:34px;font-size:13px">' + esc(initials(t.nama)) + '</span><span style="flex:1"><b>' + esc(t.nama) + '</b><div class="small muted">' + esc(t.peran) + '</div></span></div>';
  }).join('') + '</div>';
  h += '<h2 class="tsh2">Kasus saya yang masih berjalan <span class="tag">' + open.length + '</span></h2>' + (open.length ? open.map(function (r) { return tsCard(r); }).join('') : '<div class="empty small">' + ic('check') + '<div>Tidak ada kasus berjalan.</div></div>');
  if (outletOpen.length) h += '<h2 class="tsh2">Kasus lain di outlet <span class="tag">' + outletOpen.length + '</span></h2>' + outletOpen.slice(0, 6).map(function (r) { return tsCard(r, { full: false }); }).join('');
  var done = mine.filter(function (r) { return !tsIsOpen(r.status); }).slice(0, 5);
  if (done.length) h += '<h2 class="tsh2">Selesai terakhir</h2>' + done.map(function (r) { return tsCard(r, { full: false }); }).join('');
  m.innerHTML = h;
  bindPushBanner(m);
  tsBindCards(m);
  $$('[data-go]', m).forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
}

/* ---------------- kotak masuk tim TS ---------------- */
function tsEskRows() { return (S.dash && S.dash.rows || []).filter(function (r) { return r.type === 'Eskalasi'; }); }
function tsRenderInbox(m) {
  var esk = tsEskRows(), canEsk = esk.length > 0 || isAdmin();
  var h = '<div class="tshead"><div><h1>Kotak masuk</h1><div class="small muted">' + esc(String(S.user.nama).split(' ')[0]) + ' · Technical Support · semua outlet</div></div><button class="btn or sm" data-go="ts:record">' + ic('plus', 'sm') + ' Catat kasus selesai</button></div>';
  if (canEsk) h += '<div class="seg"><button class="' + (TSA.inbox === 'bantuan' ? 'on' : '') + '" data-ib="bantuan">Bantuan teknis</button><button class="' + (TSA.inbox === 'esk' ? 'on' : '') + '" data-ib="esk">Eskalasi Update SW' + (esk.filter(function (r) { return r.status === T.ESK_SENT; }).length ? ' <b>' + esk.filter(function (r) { return r.status === T.ESK_SENT; }).length + '</b>' : '') + '</button></div>';
  if (TSA.inbox === 'esk' && canEsk) {
    h += '<div class="small muted" style="margin:2px 2px 10px">Data & alur Eskalasi tetap di VTAG (tidak dipindah). Ketuk untuk membuka.</div>';
    var ord = [T.ESK_SENT, T.ESK_PENDING, T.REVISI, T.DRAFT, T.ESK_DONE];
    esk = esk.slice().sort(function (a, b) { return ord.indexOf(a.status) - ord.indexOf(b.status) || (a.ts < b.ts ? 1 : -1); });
    h += '<div id="esklist">' + (esk.length ? cardsHtml(esk) : '<div class="empty">' + ic('check') + '<div>Belum ada eskalasi.</div></div>') + '</div>';
    m.innerHTML = h; bindInboxTop(m); bindCaseClicks(m); return;
  }
  var f = TSA.ifilter;
  var open = TSA.list.filter(function (r) { return tsIsOpen(r.status); });
  var chips = [['', 'Berjalan', open.length], ['Baru', 'Baru', TSA.list.filter(function (r) { return r.status === 'Baru'; }).length],
    ['Analysis', 'Analysis', TSA.list.filter(function (r) { return r.status === 'Analysis'; }).length], ['Pending part', 'Pending part', TSA.list.filter(function (r) { return r.status === 'Pending part'; }).length],
    ['mine', 'Saya tangani', open.filter(function (r) { return r.handler === S.user.username; }).length], ['final', 'Selesai', TSA.list.filter(function (r) { return tsIsFinal(r.status); }).length]];
  h += '<div class="chips">' + chips.map(function (c) { return '<button class="chip' + (f === c[0] ? ' on' : '') + '" data-if="' + esc(c[0]) + '">' + c[1] + '<b>' + c[2] + '</b></button>'; }).join('') + '</div>';
  var l = TSA.list.filter(function (r) {
    if (f === '') return tsIsOpen(r.status);
    if (f === 'mine') return tsIsOpen(r.status) && r.handler === S.user.username;
    if (f === 'final') return tsIsFinal(r.status);
    return r.status === f;
  });
  if (f !== 'final') l.sort(function (a, b) {
    var ua = a.urgent && tsIsOpen(a.status) ? 0 : 1, ub = b.urgent && tsIsOpen(b.status) ? 0 : 1;
    if (ua !== ub) return ua - ub;
    var na = a.status === 'Baru' ? 0 : 1, nb = b.status === 'Baru' ? 0 : 1;
    if (na !== nb) return na - nb;
    return (a.upd || a.ts) < (b.upd || b.ts) ? 1 : -1;
  });
  h += l.length ? l.slice(0, 80).map(function (r) { return tsCard(r, { take: true }); }).join('') : '<div class="empty">' + ic('check') + '<div>' + (f === '' ? 'Tidak ada kasus yang berjalan. 👍' : 'Tidak ada data.') + '</div></div>';
  m.innerHTML = h;
  bindInboxTop(m);
  $$('[data-if]', m).forEach(function (b) { b.onclick = function () { TSA.ifilter = b.dataset.if; tsRenderInbox(m); }; });
  tsBindCards(m);
}
function bindInboxTop(m) {
  $$('[data-ib]', m).forEach(function (b) { b.onclick = function () { TSA.inbox = b.dataset.ib; tsRenderInbox(m); }; });
  $$('[data-go]', m).forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
}

/* ---------------- foto & video (kamera langsung, kompres & watermark di latar) ---------------- */
var TS_PHOTOS = [
  { key: 'depan', label: 'Foto tampak depan', kind: 'image', hint: 'Nopol dibaca otomatis dari foto ini' },
  { key: 'problem', label: 'Foto problem', kind: 'image' },
  { key: 'video', label: 'Video problem', kind: 'video', hint: 'Suara mesin, gejala, dll.' },
  { key: 'extra1', label: 'Foto scan / file lain', kind: 'any', hint: 'Hasil scan tool, live data, PDF' }
];
function tsLabels(list) { var o = {}; list.forEach(function (p) { o[p.key] = p.label; }); return o; }
function tsPickBtns(key, kind) {
  var b = function (icon, text, accept, cam, primary) {
    return '<label class="pick ' + (primary ? '' : 'alt') + '">' + ic(icon, 'sm') + text + '<input type="file" data-tk="' + key + '" data-src="' + (cam ? 'cam' : 'gal') + '" accept="' + accept + '"' + (cam ? ' capture="environment"' : '') + '></label>';
  };
  if (!isTouch()) return b('upload', 'Pilih file', kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : '', false, true);
  if (kind === 'image') return b('camera', 'Kamera', 'image/*', true, true) + b('folder', 'Galeri', 'image/*', false, false);
  if (kind === 'video') return b('video', 'Rekam', 'video/*', true, true) + b('folder', 'Galeri', 'video/*', false, false);
  return b('folder', 'File', '', false, true) + b('camera', 'Foto layar', 'image/*', true, false);
}
function tsAttsHtml(F, list) {
  F.proc = F.proc || {};
  return list.map(function (a) {
    var f = F.files[a.key], pr = F.proc[a.key], ex = F.existing && F.existing[a.key];
    var cls = pr ? 'busy' : f || ex ? 'have' : '';
    var st;
    if (pr) st = '<div class="fn">' + esc(pr.label) + '</div><div class="miniprog"><i style="width:' + Math.round((pr.pct || 0) * 100) + '%"></i></div>';
    else if (f) st = '<div class="fn ok">' + ic('check', 'xs') + ' ' + esc(f.name) + ' · ' + fmtSize(f.size) + (f.origSize && f.origSize > f.size * 1.05 ? ' (dari ' + fmtSize(f.origSize) + ')' : '') + '</div>' + (f.note ? '<div class="fn">' + esc(f.note) + '</div>' : '');
    else if (ex) st = '<div class="fn ok">' + ic('check', 'xs') + ' Sudah ada · pilih lagi untuk ganti</div>';
    else st = '<div class="fn">' + (a.hint ? esc(a.hint) : 'Opsional') + '</div>';
    var th = f && f.thumb ? '<img alt="" src="' + f.thumb + '">' : ic(f || ex ? 'check' : kindIcon(a.kind), 'lg');
    return '<div class="att ' + cls + '" data-att="' + a.key + '"><div class="ai">' + th + '</div><div class="t"><b>' + esc(a.label) + '</b>' + st + '</div><div class="acts">' +
      (pr ? (pr.cancel ? '<button type="button" class="xbtn" data-skip="' + a.key + '">Lewati</button>' : '') : tsPickBtns(a.key, a.kind) + (f ? '<button type="button" class="xbtn" data-rm="' + a.key + '">Hapus</button>' : '')) + '</div></div>';
  }).join('');
}
/** Pasang daftar lampiran di elemen box; redraw dipanggil setiap ada perubahan status. */
function tsMountAtts(box, F, list, onImage) {
  var draw = function () {
    if (!box.isConnected) return;
    box.innerHTML = tsAttsHtml(F, list);
    $$('input[type=file]', box).forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; inp.value = ''; if (f) tsPickFile(F, list, inp.dataset.tk, f, inp.dataset.src, draw, onImage); }; });
    $$('[data-rm]', box).forEach(function (b) { b.onclick = function () { delete F.files[b.dataset.rm]; draw(); }; });
    $$('[data-skip]', box).forEach(function (b) { b.onclick = function () { var p = F.proc[b.dataset.skip]; if (p && p.cancel) p.cancel(); }; });
  };
  F.redraw = draw;
  draw();
  return draw;
}
function tsWm(F, item, file, src) {
  var v = F.v || {};
  var t = src === 'cam' ? Date.now() : (file.lastModified && file.lastModified > 1420070400000 ? file.lastModified : Date.now());
  var nop = String(v.nopol || ($('#t_nopol') && $('#t_nopol').value) || '').toUpperCase();
  return { t: t, src: src, tag: 'OTOKLIX · TECH SUPPORT', line2: [[v.brand, v.model].filter(Boolean).join(' ') || 'Kendaraan', nop].filter(Boolean).join('  ·  '),
    outlet: v.outlet || S.user.outlet, user: S.user.nama, label: item.label };
}
function tsPickFile(F, list, key, file, src, draw, onImage) {
  F.proc = F.proc || {};
  var item = list.filter(function (x) { return x.key === key; })[0] || { key: key, label: key, kind: 'any' };
  if (!file.size) { toast('File kosong / tidak bisa dibaca. Pilih ulang.'); return; }
  if (file.size > 500 * 1024 * 1024) { toast('File terlalu besar (maks 500 MB).'); return; }
  var isImg = /^image\//.test(file.type || '') || (item.kind === 'image' && !file.type);
  var isVid = /^video\//.test(file.type || '');
  if (isImg && onImage) onImage(key, file);
  var wmOn = opt('watermark', true);
  F.files[key] = { blob: file, name: file.name || (key + (isImg ? '.jpg' : isVid ? '.mp4' : '')), type: file.type || 'application/octet-stream', size: file.size, origSize: file.size, thumb: '' };
  var cur = F.files[key];
  var done = function () { delete F.proc[key]; if (F.waiters) { F.waiters.forEach(function (w) { w(); }); F.waiters = []; } draw(); };
  if (isImg) {
    F.proc[key] = { pct: 0.5, label: wmOn ? 'Memberi watermark & mengompres foto…' : 'Mengompres foto…' }; draw();
    compressImage(file, opt('kompres_foto', true), wmOn ? tsWm(F, item, file, src) : null).then(function (r) {
      if (F.files[key] !== cur || !r) return;
      if (r.thumb) cur.thumb = r.thumb;
      if (r.blob) { cur.blob = r.blob; cur.name = r.name; cur.type = r.type; cur.size = r.blob.size; if (r.wm) cur.note = '🕒 Watermark ' + fmtStamp(Date.now()); }
    }).catch(function () { /* kirim asli */ }).then(done);
    return;
  }
  if (isVid && canCompressVideo() && (wmOn || (opt('kompres_video', true) && file.size >= CONFIG.VID_MIN_BYTES))) {
    var ctrl = new AbortController(), wm = wmOn ? tsWm(F, item, file, src) : null, t0 = Date.now();
    var verb = wm ? 'Memberi watermark video' : 'Mengompres video';
    F.proc[key] = { pct: 0, label: verb + '… (boleh lanjut mengisi form)', cancel: function () { ctrl.abort(); } }; draw();
    var onVis = function () { if (document.visibilityState === 'hidden') ctrl.abort(); };
    document.addEventListener('visibilitychange', onVis);
    var tick = throttle(draw, 700);
    compressVideo(file, function (p, left) { if (F.proc[key]) { F.proc[key].pct = p; F.proc[key].label = verb + '… ' + Math.round(p * 100) + '% (±' + Math.ceil(left) + ' dtk, boleh lanjut mengisi)'; } tick(); }, ctrl.signal, wm).then(function (r) {
      document.removeEventListener('visibilitychange', onVis);
      if (F.files[key] !== cur) return;
      if (r.thumb) cur.thumb = r.thumb;
      if (r.out) { cur.blob = r.out.blob; cur.name = r.out.name; cur.type = r.out.type; cur.size = r.out.blob.size; cur.note = (r.out.wm ? '🕒 Watermark ditambahkan' : 'Video dikompres') + ' dalam ' + Math.round((Date.now() - t0) / 1000) + ' dtk'; }
      else if (r.reason !== 'sudah kecil' && r.reason !== 'tidak lebih kecil') cur.note = 'Dikirim ukuran asli' + (wm ? ' tanpa watermark' : '') + (r.reason === 'batal' ? ' (dilewati)' : '');
    }).catch(function () { /* kirim asli */ }).then(done);
    return;
  }
  if (isVid && wmOn) cur.note = isIOS() ? 'Watermark video belum didukung di iPhone (dikirim asli)' : 'Dikirim ukuran asli';
  draw();
}
/** Tunggu kompres foto/video selesai sebelum dikirim. */
function tsWaitProc(F) {
  if (!F.proc || !Object.keys(F.proc).length) return Promise.resolve();
  return new Promise(function (res) {
    F.waiters = F.waiters || [];
    var chk = function () { if (!Object.keys(F.proc).length) res(); else F.waiters.push(chk); };
    chk();
  });
}
function tsFilesOf(F) { var o = {}; Object.keys(F.files).forEach(function (k) { if (F.files[k] && F.files[k].blob) o[k] = F.files[k]; }); return o; }

/** Upload 1 file ke folder kasus (resumable, lanjut otomatis bila koneksi putus sebentar). */
function tsUploadFile(id, key, f, label, onProg) {
  var size = f.blob.size, off = 0, uid = null, fails = 0;
  TSA.uploading++;
  function step() {
    if (off >= size) return Promise.resolve();
    var end = Math.min(off + CONFIG.CHUNK, size);
    return f.blob.slice(off, end).arrayBuffer().then(ab2b64).then(function (b64) {
      return api('tsUploadChunk', uid, off, b64).then(function (r) {
        fails = 0;
        if (r.expired) throw new AppError('Sesi upload kedaluwarsa. Coba kirim ulang lampiran ini.', 'app');
        off = r.done ? size : r.next;
      }, function (e) {
        if (e.kind === 'auth' || e.kind === 'config' || ++fails > 6) throw e;
        return (e.kind === 'net' ? waitOnline() : sleep(Math.min(20000, 1500 * Math.pow(2, fails)))).then(function () { return api('tsUploadStatus', uid); }).then(function (st) {
          if (st.expired) throw new AppError('Upload terputus terlalu lama. Coba kirim ulang lampiran ini.', 'app');
          off = st.done ? size : (st.next || 0);
        });
      });
    }).then(function () { if (onProg) onProg(off / size); return step(); });
  }
  return apiRetry('tsStartUpload', id, key, f.name, f.type, size, label || '').then(function (r) { uid = r.uploadId; return step(); })
    .finally(function () { TSA.uploading = Math.max(0, TSA.uploading - 1); });
}
/** Upload di latar: aplikasi tetap bisa dipakai, progres tampil di pil kecil. */
TSA.q = [];
function tsBgUpload(id, files, labels, onDone) {
  var keys = Object.keys(files).filter(function (k) { return files[k] && files[k].blob; });
  if (!keys.length) { if (onDone) onDone({ failed: [] }); return; }
  var job = { id: id, files: files, labels: labels || {}, keys: keys, done: 0, pct: 0, failed: [], onDone: onDone, cur: '' };
  TSA.q.push(job);
  tsPillDraw();
  if (TSA.q.length === 1) tsRunQueue();
}
function tsRunQueue() {
  var job = TSA.q[0];
  if (!job) { tsPillDraw(); wake(false); return; }
  wake(true);
  job.keys.reduce(function (p, k) {
    return p.then(function () {
      job.cur = job.labels[k] || k; job.pct = 0; tsPillDraw();
      return tsUploadFile(job.id, k, job.files[k], job.labels[k] || '', function (x) { job.pct = x; tsPillDraw(); })
        .then(function () { job.done++; }, function (e) { job.done++; job.failed.push({ key: k, msg: errMsg(e) }); });
    });
  }, Promise.resolve()).then(function () {
    TSA.q.shift();
    var res = { failed: job.failed };
    if (job.failed.length) { TSA.lastFail = job; toast(job.failed.length + ' lampiran gagal terkirim. Ketuk tombol merah untuk mengulang.', 7000); }
    else toast(job.keys.length > 1 ? job.keys.length + ' lampiran terkirim.' : 'Lampiran terkirim.');
    if (job.onDone) try { job.onDone(res); } catch (e) { /* */ }
    if (TSA.caseId === job.id) tsRefreshCase();
    tsSyncNow();
    tsRunQueue();
  });
}
function tsPillDraw() {
  var host = $('#tsPill');
  if (!host) { host = document.createElement('div'); host.id = 'tsPill'; document.body.appendChild(host); }
  var job = TSA.q[0];
  if (job) {
    var all = TSA.q.reduce(function (a, j) { return a + j.keys.length; }, 0), dn = TSA.q.reduce(function (a, j) { return a + j.done; }, 0);
    host.innerHTML = '<button class="sendpill">' + ic('upload', 'sm') + ' Mengirim lampiran ' + (dn + 1) + '/' + all + ' · ' + Math.round((job.pct || 0) * 100) + '%</button>';
    host.firstChild.onclick = function () { toast('Mengirim ' + job.cur + '… Aplikasi boleh dipakai, jangan ditutup.'); };
  } else if (TSA.lastFail) {
    host.innerHTML = '<button class="sendpill err">' + ic('refresh', 'sm') + ' ' + TSA.lastFail.failed.length + ' lampiran gagal · ulangi</button>';
    host.firstChild.onclick = function () {
      var j = TSA.lastFail; TSA.lastFail = null;
      var f = {}; j.failed.forEach(function (x) { f[x.key] = j.files[x.key]; });
      tsBgUpload(j.id, f, j.labels, j.onDone);
    };
  } else host.innerHTML = '';
}
window.addEventListener('beforeunload', function (e) { if (TSA.q && TSA.q.length) { e.preventDefault(); e.returnValue = ''; } });

/* ---------------- form minta bantuan (alur A) ---------------- */
function tsEmptyForm() {
  var outs = TSA.boot.outlets || [];
  return { v: { outlet: S.user.outlet === '*' || isAdmin() ? '' : S.user.outlet, brand: '', model: '', nopol: '', odo: '', sistem: '', keluhan: '', dtc: '', urgent: false }, files: {}, key: 'ts' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), outs: outs };
}
function tsSaveFormText() { try { if (TSA.form) store('vt_tsform_' + S.user.username, JSON.stringify({ v: TSA.form.v, key: TSA.form.key })); } catch (e) { /* */ } }
function tsVehicleFields(v, outs, withOutlet) {
  var c = tsCfg();
  var brands = c.brands.slice();
  if (v.brand && brands.indexOf(v.brand) < 0) brands.unshift(v.brand);
  return (withOutlet ? '<div><label>Outlet <span class="req">*</span></label><select id="t_outlet"><option value="">Pilih outlet…</option>' + outs.map(function (o) { return '<option' + (v.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>' : '') +
    '<div class="two"><div><label>Brand <span class="req">*</span></label><select id="t_brand"><option value="">Pilih…</option>' + brands.map(function (b) { return '<option' + (v.brand === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Model</label><input type="text" id="t_model" value="' + esc(v.model) + '" placeholder="mis. Avanza"></div></div>' +
    '<div class="two"><div><label>Nopol</label><input type="text" id="t_nopol" value="' + esc(v.nopol) + '" placeholder="B 1234 XYZ" autocapitalize="characters"></div>' +
    '<div><label>ODO (km) <span class="opt">opsional</span></label><input type="text" inputmode="numeric" id="t_odo" value="' + esc(v.odo) + '"></div></div>';
}
function tsSystemChips(v) {
  return '<label>Sistem</label><div class="chips wrap" id="t_sis">' + tsCfg().systems.map(function (s) { return '<button type="button" class="chip' + (v.sistem === s ? ' on' : '') + '" data-s="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
}
function tsCollect(F) {
  var g = function (id) { var e = document.getElementById(id); return e ? e.value : undefined; };
  ['outlet', 'brand', 'model', 'nopol', 'odo', 'keluhan', 'dtc', 'teknisi', 'tanggal', 'penyebab', 'solusi', 'part'].forEach(function (k) { var x = g('t_' + k); if (x !== undefined) F.v[k] = x; });
  var u = document.getElementById('t_urgent'); if (u) F.v.urgent = u.checked;
  var r = document.getElementById('t_ref'); if (r) F.v.referensi = r.checked;
}
function tsRenderForm(m) {
  if (!TSA.form) {
    TSA.form = tsEmptyForm();
    try { var sv = JSON.parse(store('vt_tsform_' + S.user.username) || 'null'); if (sv && sv.v) { TSA.form.v = Object.assign(TSA.form.v, sv.v); TSA.form.key = sv.key || TSA.form.key; } } catch (e) { /* */ }
  }
  var F = TSA.form, v = F.v, needOutlet = S.user.outlet === '*' || isAdmin();
  m.innerHTML = '<div class="tshead"><div><h1>Minta bantuan</h1><div class="small muted">Isi singkat saja. Detail bisa dilanjutkan lewat Log.</div></div></div>' +
    '<form id="tsf" class="stack" autocomplete="off">' +
    '<div class="card stack"><div class="sec-n">1 · KENDARAAN</div>' + tsVehicleFields(v, F.outs, needOutlet) + '</div>' +
    '<div class="card stack"><div class="sec-n">2 · MASALAH</div>' + tsSystemChips(v) +
    '<div><label>Keluhan / gejala <span class="req">*</span></label><textarea id="t_keluhan" placeholder="Apa yang terjadi, sejak kapan, sudah dicek apa saja">' + esc(v.keluhan) + '</textarea></div>' +
    '<div><label>Kode DTC <span class="opt">opsional</span></label><input type="text" id="t_dtc" class="mono" value="' + esc(v.dtc) + '" placeholder="P0300, P0171" autocapitalize="characters"></div></div>' +
    '<div class="card"><div class="sec-n">3 · FOTO & VIDEO</div><div class="small muted" style="margin:2px 0 6px">Ambil langsung dari kamera. Foto/video dikompres & diberi watermark otomatis.</div><div id="t_picks"></div></div>' +
    '<div id="t_sim"></div>' +
    '<label class="urgbox"><input type="checkbox" id="t_urgent"' + (v.urgent ? ' checked' : '') + '><span><b>URGENT</b> · mobil mogok / customer menunggu. Tombol telepon &amp; WhatsApp Tech Support langsung muncul.</span></label>' +
    '<div id="t_err" class="msg err hidden"></div>' +
    '<div class="sendbar"><button class="btn or block" type="submit" id="t_go">' + ic('send') + ' Kirim ke Tech Support</button></div>' +
    '<div class="small muted" style="text-align:center;margin-top:-4px">' + (tsCfg().ai.ready ? 'Saran awal AI muncul dalam beberapa detik' : 'Saran dari kasus serupa muncul otomatis') + ' · HP Tech Support berbunyi</div></form>';
  tsMountAtts($('#t_picks'), F, TS_PHOTOS, function (k, file) { if (k === 'depan') tsOcrPlate(file); });
  $$('#t_sis .chip').forEach(function (b) { b.onclick = function () { v.sistem = v.sistem === b.dataset.s ? '' : b.dataset.s; $$('#t_sis .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.s === v.sistem); }); tsSimSoon(); tsSaveFormText(); }; });
  $('#tsf').oninput = function () { tsCollect(F); tsSaveFormText(); tsSimSoon(); };
  $('#tsf').onchange = function () { tsCollect(F); tsSaveFormText(); };
  $('#tsf').onsubmit = function (e) { e.preventDefault(); tsSubmitRequest(); };
  tsSimSoon();
}
function tsSimSoon() {
  clearTimeout(TSA.simT);
  TSA.simT = setTimeout(function () {
    var F = TSA.form, box = $('#t_sim');
    if (!F || !box) return;
    var v = F.v;
    if (String(v.keluhan || '').trim().length < 6 && !String(v.dtc || '').trim()) { box.innerHTML = ''; return; }
    api('tsSimilar', { brand: v.brand, model: v.model, sistem: v.sistem, keluhan: v.keluhan, dtc: v.dtc }).then(function (list) {
      if (!$('#t_sim')) return;
      $('#t_sim').innerHTML = list.length ? '<div class="simbox"><b>Kasus serupa sebelumnya</b>' + list.map(function (s) {
        return '<div class="simi"><span class="small muted">' + esc([s.brand, s.model].filter(Boolean).join(' ') + (s.sistem ? ' · ' + s.sistem : '') + (s.dtc ? ' · ' + s.dtc : '')) + '</span><div>' + esc(s.keluhan) + '</div><div class="ok"><b>Solusi:</b> ' + esc(s.solusi) + '</div></div>';
      }).join('') + '</div>' : '';
    }).catch(function () { /* opsional */ });
  }, 900);
}
function tsOcrPlate(file) {
  var inp = $('#t_nopol'), box = $('#ocr_nopol');
  if (!inp) return;
  if (!box) { box = document.createElement('div'); box.id = 'ocr_nopol'; box.className = 'ocrhint'; inp.parentNode.appendChild(box); }
  if (!navigator.onLine) { box.style.display = ''; box.innerHTML = '📷 Offline: nopol belum bisa dibaca dari foto. Isi manual ya.'; return; }
  box.style.display = ''; box.innerHTML = '<span class="spin xs"></span> Membaca nopol dari foto tampak depan…';
  // 1) baca seluruh foto; 2) bila plat belum ketemu, baca ulang bagian bawah-tengah yang diperbesar (plat biasanya di situ)
  imageForOcr(file).then(function (b64) { return api('tsOcr', b64, 'image/jpeg'); }).then(function (r) {
    if (parsePlate(r.text).all.length) return r;
    return tsCropForOcr(file).then(function (b64) { return api('tsOcr', b64, 'image/jpeg'); }).then(function (r2) { return { text: r.text + '\n' + r2.text }; }, function () { return r; });
  }).then(function (r) {
    var p = parsePlate(r.text), list = p.all, cur = inp.value.trim();
    if (!$('#ocr_nopol')) return;
    if (!list.length) { box.innerHTML = cur ? '' : '📷 Nopol tidak terbaca dari foto. Isi manual ya.'; box.style.display = cur ? 'none' : ''; return; }
    if (cur && list.some(function (x) { return plateKey(x) === plateKey(cur); })) { box.innerHTML = '📷 ✓ Sama dengan foto.'; return; }
    if (!cur && (p.strong.length === 1 || list.length === 1)) { inp.value = list[0]; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.classList.add('ocrfill'); box.innerHTML = '📷 Nopol terisi dari foto tampak depan. Mohon cek kembali.'; return; }
    box.innerHTML = '📷 Terbaca dari foto, ketuk untuk memakai: ' + list.slice(0, 4).map(function (x) { return '<button type="button" class="chip" data-pl="' + esc(x) + '">' + esc(x) + '</button>'; }).join(' ');
    $$('[data-pl]', box).forEach(function (b) { b.onclick = function () { inp.value = b.dataset.pl; inp.dispatchEvent(new Event('input', { bubbles: true })); box.innerHTML = '📷 Diisi dari foto. Mohon cek kembali.'; }; });
  }).catch(function () { if ($('#ocr_nopol')) box.innerHTML = '📷 Nopol belum bisa dibaca dari foto. Isi manual ya.'; });
}
function tsCropForOcr(file) {
  return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bm) {
    var sx = bm.width * 0.12, sy = bm.height * 0.38, sw = bm.width * 0.76, sh = bm.height * 0.58;
    var sc = Math.min(2.5, 2200 / sw), c = document.createElement('canvas');
    c.width = Math.round(sw * sc); c.height = Math.round(sh * sc);
    var ctx = c.getContext('2d'); ctx.filter = 'grayscale(1) contrast(1.5)';
    ctx.drawImage(bm, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.92); });
  }).then(function (blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(blob); });
  });
}
function tsShowErr(id, msg) { var e = $(id); if (!e) { toast(msg); return; } e.innerHTML = ic('warn') + '<span>' + esc(msg) + '</span>'; e.classList.remove('hidden'); e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
function tsSubmitRequest() {
  var F = TSA.form; tsCollect(F);
  var v = F.v, miss = [];
  if (!v.outlet) miss.push('Outlet');
  if (!v.brand) miss.push('Brand');
  if (!String(v.keluhan || '').trim()) miss.push('Keluhan / gejala');
  if (miss.length) { tsShowErr('#t_err', 'Lengkapi dulu: ' + miss.join(', ') + '.'); return; }
  var btn = $('#t_go'); btn.disabled = true;
  $('#t_err').classList.add('hidden');
  var busyP = F.proc && Object.keys(F.proc).length;
  btn.textContent = busyP ? 'Menyelesaikan kompres foto/video…' : 'Mengirim…';
  tsWaitProc(F).then(function () { if ($('#t_go')) $('#t_go').textContent = 'Mengirim…'; return api('tsCreate', v, F.key); }).then(function (r) {
    var id = r.id;
    store('vt_tsform_' + S.user.username, null);
    TSA.form = null;
    tsBgUpload(id, tsFilesOf(F), tsLabels(TS_PHOTOS), function () {
      api('tsAssist', id).catch(function () { /* opsional */ }).then(function () { if (TSA.caseId === id) tsRefreshCase(); });
    });
    toast('Terkirim ke Tech Support.' + (Object.keys(tsFilesOf(F)).length ? ' Foto dikirim di latar.' : '') + (v.urgent ? ' Tombol telepon & WhatsApp ada di halaman kasus.' : ''), 5000);
    if (!Object.keys(tsFilesOf(F)).length) api('tsAssist', id).catch(function () { /* */ }).then(function () { if (TSA.caseId === id) tsRefreshCase(); });
    tsSyncNow();
    TSA.back = tsHome();
    tsOpen(id);
  }).catch(function (e) {
    tsShowErr('#t_err', errMsg(e));
    if ($('#t_go')) { btn.disabled = false; btn.innerHTML = ic('send') + ' Kirim ke Tech Support'; }
  });
}

/* ---------------- catat kasus selesai (alur B, tim TS) ---------------- */
var TS_REC_PHOTOS = [{ key: 'depan', label: 'Foto tampak depan', kind: 'image', hint: 'Nopol dibaca otomatis dari foto ini' }, { key: 'problem', label: 'Foto problem', kind: 'image' },
  { key: 'solving1', label: 'Foto problem solving 1', kind: 'image' }, { key: 'solving2', label: 'Foto problem solving 2', kind: 'image' }, { key: 'video', label: 'Video', kind: 'video' }];
function tsTodayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function tsStatusChips(cur, list) {
  return '<div class="chips wrap" id="t_st">' + list.map(function (s) { return '<button type="button" class="chip st ' + tsStClass(s) + (cur === s ? ' on' : '') + '" data-st="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
}
function tsRenderRecord(m) {
  if (!TSA.rec) TSA.rec = { v: { outlet: '', brand: '', model: '', nopol: '', odo: '', sistem: '', keluhan: '', dtc: '', teknisi: '', tanggal: tsTodayIso(), penyebab: '', solusi: '', part: '', status: 'Resolved', referensi: true, sumber: 'Telepon/WA' }, files: {}, key: 'tr' + Date.now().toString(36) };
  var F = TSA.rec, v = F.v;
  var names = (S.techNames || []);
  m.innerHTML = '<div class="tshead"><div><h1>Catat kasus selesai</h1><div class="small muted">Untuk bantuan lewat telepon / WhatsApp. PDF report dibuat otomatis.</div></div></div>' +
    '<form id="tsr" class="stack" autocomplete="off">' +
    '<div class="card stack"><div class="sec-n">PENANGANAN</div><div class="two"><div><label>Tanggal</label><input type="date" id="t_tanggal" value="' + esc(v.tanggal) + '"></div>' +
    '<div><label>Lewat</label><select id="t_sumber">' + ['Telepon/WA', 'Datang ke outlet', 'Remote'].map(function (s) { return '<option' + (v.sumber === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>' +
    '<div><label>Teknisi yang dibantu <span class="req">*</span></label><input type="text" id="t_teknisi" list="t_tlist" value="' + esc(v.teknisi) + '" placeholder="Nama teknisi"><datalist id="t_tlist">' + names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></div>' +
    tsVehicleFields(v, TSA.boot.outlets || [], true) + '</div>' +
    '<div class="card stack"><div class="sec-n">MASALAH</div>' + tsSystemChips(v) +
    '<div><label>Keluhan / issue <span class="req">*</span></label><textarea id="t_keluhan">' + esc(v.keluhan) + '</textarea></div>' +
    '<div><label>Kode DTC <span class="opt">opsional</span></label><input type="text" id="t_dtc" class="mono" value="' + esc(v.dtc) + '"></div></div>' +
    '<div class="card stack"><div class="sec-n">HASIL PENANGANAN</div><div><label>Penyebab <span class="opt">opsional</span></label><textarea id="t_penyebab" style="min-height:60px">' + esc(v.penyebab) + '</textarea></div>' +
    '<div><label>Result / solusi <span class="req">*</span></label><textarea id="t_solusi" placeholder="1. …&#10;2. …">' + esc(v.solusi) + '</textarea></div>' +
    '<div><label>Part diganti <span class="opt">opsional</span></label><input type="text" id="t_part" value="' + esc(v.part) + '"></div>' +
    '<div><label>Status akhir</label>' + tsStatusChips(v.status, TS_ST_ORDER.slice(1)) + '</div>' +
    '<label class="check"><input type="checkbox" id="t_ref"' + (v.referensi !== false ? ' checked' : '') + '> Jadikan referensi "kasus serupa" untuk teknisi lain</label></div>' +
    '<div class="card"><div class="sec-n">FOTO & VIDEO</div><div id="t_picks" style="margin-top:8px"></div></div>' +
    '<div id="t_err" class="msg err hidden"></div><div class="sendbar"><button class="btn or block" type="submit" id="t_go">' + ic('check') + ' Simpan & buat PDF</button></div></form>';
  tsMountAtts($('#t_picks'), F, TS_REC_PHOTOS, function (k, file) { if (k === 'depan') tsOcrPlate(file); });
  $$('#t_sis .chip').forEach(function (b) { b.onclick = function () { v.sistem = v.sistem === b.dataset.s ? '' : b.dataset.s; $$('#t_sis .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.s === v.sistem); }); }; });
  $$('#t_st .chip').forEach(function (b) { b.onclick = function () { v.status = b.dataset.st; $$('#t_st .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
  $('#tsr').oninput = function () { tsCollect(F); var s = $('#t_sumber'); if (s) v.sumber = s.value; };
  $('#tsr').onsubmit = function (e) {
    e.preventDefault(); tsCollect(F); v.sumber = $('#t_sumber').value;
    var miss = [];
    if (!String(v.teknisi || '').trim()) miss.push('Teknisi');
    if (!v.outlet) miss.push('Outlet');
    if (!v.brand) miss.push('Brand');
    if (!String(v.keluhan || '').trim()) miss.push('Keluhan');
    if (tsIsFinal(v.status) && !String(v.solusi || '').trim()) miss.push('Result / solusi');
    if (miss.length) { tsShowErr('#t_err', 'Lengkapi dulu: ' + miss.join(', ') + '.'); return; }
    var btn = $('#t_go'); btn.disabled = true; btn.textContent = F.proc && Object.keys(F.proc).length ? 'Menyelesaikan kompres…' : 'Menyimpan…';
    tsWaitProc(F).then(function () { return api('tsRecord', v, F.key); }).then(function (r) {
      TSA.rec = null;
      var files = tsFilesOf(F);
      tsSyncNow(); TSA.back = 'ts:inbox';
      tsOpen(r.id);
      if (Object.keys(files).length) { toast('Tersimpan. Foto dikirim di latar, PDF dibuat setelah foto terkirim.', 5000); tsBgUpload(r.id, files, tsLabels(TS_REC_PHOTOS), function () { tsMakePdf(r.id, true); }); }
      else tsMakePdf(r.id, true);
    }).catch(function (e) { tsShowErr('#t_err', errMsg(e)); if ($('#t_go')) { btn.disabled = false; btn.innerHTML = ic('check') + ' Simpan & buat PDF'; } });
  };
  if (!S.techNames) apiRetry('tsAdminGet').then(function (a) { S.techNames = a.users.map(function (u) { return u.nama; }); var dl = $('#t_tlist'); if (dl) dl.innerHTML = S.techNames.map(function (n) { return '<option value="' + esc(n) + '">'; }).join(''); }).catch(function () { S.techNames = []; });
}

/* ---------------- detail kasus + Log ---------------- */
function tsOpen(id) {
  if (!S.app || S.app !== 'ts') { S.app = 'ts'; store(tsAppKey(), 'ts'); renderApsw(); if (!TSA.boot) tsLoad(); }
  closeModal();
  if (S.tab !== 'ts:case') TSA.back = S.tab && String(S.tab).indexOf('ts:') === 0 ? S.tab : tsHome();
  if (TSA.caseId !== id) TSA.caseData = TSA.cache[id] || null;
  TSA.caseId = id;
  S.tab = 'ts:case';
  renderNav(); renderView(); window.scrollTo(0, 0);
  tsRefreshCase();
}
/** Muat detail kasus. Permintaan yang bertumpuk digabung (hanya 1 yang jalan + 1 susulan). */
TSA.cache = {};
var tsRef = { busy: null, again: false };
function tsRefreshCase() {
  if (tsRef.busy) { tsRef.again = true; return tsRef.busy; }
  var id = TSA.caseId;
  if (!id) return Promise.resolve();
  tsRef.busy = apiRetry('tsGet', id).then(function (d) {
    TSA.cache[id] = d;
    if (TSA.caseId !== id) return;
    TSA.caseData = d;
    if (S.tab === 'ts:case') tsRenderCase($('#main'));
  }, function (e) {
    if (TSA.caseId !== id) return;
    toast(errMsg(e));
    if (!TSA.caseData) { S.tab = TSA.back || tsHome(); renderNav(); renderView(); }
  }).finally(function () {
    tsRef.busy = null;
    if (tsRef.again) { tsRef.again = false; if (TSA.caseId) tsRefreshCase(); }
  });
  return tsRef.busy;
}
function tsWaNum(n) { n = String(n || '').replace(/[^0-9+]/g, ''); if (n.charAt(0) === '+') n = n.slice(1); if (n.charAt(0) === '0') n = '62' + n.slice(1); return n; }
function tsUrgentMsg(t) {
  var tpl = (tsCfg().urgent && tsCfg().urgent.template) || 'URGENT {id} · {kendaraan} {nopol} · {outlet} · {keluhan}';
  var k = String(t.Keluhan || ''); if (k.length > 160) k = k.slice(0, 160) + '…';
  return tpl.replace(/\{id\}/g, t.TicketID).replace(/\{kendaraan\}/g, tsVeh(t)).replace(/\{nopol\}/g, t.Nopol || '').replace(/\{outlet\}/g, t.Outlet || '')
    .replace(/\{keluhan\}/g, k).replace(/\{link\}/g, location.origin + location.pathname + '?case=' + encodeURIComponent(t.TicketID)).replace(/\s+·\s+·/g, ' ·');
}
function tsContactBar(d) {
  var t = d.t, cs = (d.contacts || []).filter(function (c) { return c.wa && c.username !== S.user.username; });
  if (!(t.Urgent === 'TRUE' && tsIsOpen(t.Status)) || tsCfg().urgent.buttons === false || d.flags.staff && !d.flags.mine) return '';
  if (!cs.length) return '<div class="urgbar"><b>URGENT</b><span class="small">Nomor WA Tech Support belum diatur admin.</span></div>';
  var c = cs[0], num = tsWaNum(c.wa);
  return '<div class="urgbar"><span style="flex:1"><b>URGENT</b> · hubungi ' + esc(String(c.nama).split(' ')[0]) + '</span>' +
    '<a class="btn sec sm" href="tel:+' + esc(num) + '">' + ic('phone', 'sm') + ' Telepon</a>' +
    '<a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/' + esc(num) + '?text=' + encodeURIComponent(tsUrgentMsg(t)) + '">' + ic('wa', 'sm') + ' WhatsApp</a></div>' +
    (cs.length > 1 ? '<div class="small muted" style="margin:-6px 2px 10px">Kontak lain: ' + cs.slice(1).map(function (x) { return '<a target="_blank" rel="noopener" href="https://wa.me/' + esc(tsWaNum(x.wa)) + '?text=' + encodeURIComponent(tsUrgentMsg(t)) + '">' + esc(x.nama) + '</a>'; }).join(', ') + '</div>' : '');
}
function tsProgress(st) {
  var steps = ['Baru', 'Analysis', 'Pending part', 'Selesai'];
  var idx = st === 'Baru' ? 0 : st === 'Analysis' ? 1 : st === 'Pending part' ? 2 : 3;
  return '<div class="tsprog">' + steps.map(function (s, i) { return '<span class="' + (i <= idx ? 'on' : '') + '"><i></i>' + esc(i === 3 && tsIsFinal(st) ? st : s) + '</span>'; }).join('') + '</div>';
}
function tsIsImg(f) { return /^image\//.test(f.mime || '') || /\.(jpe?g|png|webp|heic|gif)$/i.test(f.name || ''); }
function tsFileTile(f) {
  var th = TSA.thumbs[f.id];
  return '<a class="ftile" href="' + esc(f.url) + '" target="_blank" rel="noopener" data-fid="' + esc(tsIsImg(f) ? f.id : '') + '">' +
    (th ? '<img src="' + esc(th) + '" alt="">' : '<span class="fic">' + ic(tsIsImg(f) ? 'camera' : /video/.test(f.mime || '') || /\.(mp4|mov|webm|3gp)$/i.test(f.name) ? 'video' : 'file') + '</span>') +
    '<span class="fl">' + esc(f.label) + '</span></a>';
}
function tsLoadThumbs(id, files) {
  var need = files.filter(function (f) { return tsIsImg(f) && !TSA.thumbs[f.id] && TSA.thumbs[f.id] !== ''; }).slice(0, 12);
  need.reduce(function (p, f) {
    return p.then(function () {
      if (TSA.caseId !== id) return;
      return api('tsThumb', id, f.id).then(function (r) {
        TSA.thumbs[f.id] = r && r.b64 ? 'data:' + r.mime + ';base64,' + r.b64 : '';
        $$('[data-fid="' + f.id + '"]').forEach(function (a) { if (TSA.thumbs[f.id]) { var ic0 = a.querySelector('.fic'); if (ic0) ic0.outerHTML = '<img src="' + TSA.thumbs[f.id] + '" alt="">'; } });
      }, function () { TSA.thumbs[f.id] = ''; });
    });
  }, Promise.resolve());
}
function tsLogHtml(d) {
  var files = {}; d.files.forEach(function (f) { if (f.log) files[f.log] = f; });
  var me = S.user.username, staff = d.flags.staff;
  return d.log.map(function (l) {
    var tm = fmtDT(l.ts);
    if (l.peran === 'sistem') return '<div class="lsys">' + esc(tm) + ' · ' + esc(l.teks) + '</div>';
    if (l.peran === 'ai') {
      var src = l.meta && l.meta.auto ? 'Asisten AI · balasan otomatis (Tech Support belum membalas ' + (l.meta.menit || 5) + ' mnt)' : l.jenis === 'ai' ? 'Asisten AI · saran awal' : 'Kasus serupa · otomatis';
      var st = l.meta && l.meta.dicek ? ' · sudah dicek ' + esc(String(l.meta.by || '').split(' ')[0]) : l.meta && l.meta.hidden ? ' · draf (belum dikirim ke teknisi)' : ' · belum dicek Tech Support';
      return '<div class="lmsg ai"><div class="lh">' + src + st + ' · ' + esc(tm) + '</div><div class="lb">' + esc(tsStripMd(l.teks)) + '</div>' +
        (staff && !(l.meta && l.meta.dicek) ? '<div class="row" style="margin-top:6px"><button class="btn sm" data-aiok="' + esc(l.id) + '" style="background:#6d28d9">' + ic('check', 'sm') + (l.meta && l.meta.hidden ? ' Kirim ke teknisi' : ' Setujui saran') + '</button></div>' : '') + '</div>';
    }
    var mine = l.by === me, right = l.peran === 'ts';
    var f = l.file ? files[l.id] || d.files.filter(function (x) { return x.id === l.file; })[0] : null;
    var body = l.jenis === 'file' && f ? tsFileTile(f) : '<div class="lb">' + esc(l.teks) + '</div>';
    if (l.jenis === 'hasil') body = '<div class="lb"><b>' + esc(l.teks) + '</b></div>';
    return '<div class="lmsg ' + (right ? 'ts' : 'tk') + (mine ? ' mine' : '') + '"><div class="lh">' + esc(l.name) + ' · ' + (l.peran === 'ts' ? 'Tech Support' : 'teknisi') + ' · ' + esc(tm) + '</div>' + body + '</div>';
  }).join('') + tsPendHtml(d);
}
/* ---- pesan yang sedang dikirim: langsung tampil tanpa menunggu server ---- */
TSA.pend = [];
function tsStripMd(t) { return String(t || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/^#{1,6}\s*/gm, ''); }
function tsPendSide(d) { return d.flags.staff && !d.flags.mine ? 'ts' : 'tk'; }
function tsPendOne(p, side) {
  var st = p.state === 'err' ? '<span class="pst err">Gagal terkirim · ketuk untuk ulangi</span>' : p.state === 'ok' ? '<span class="pst">✓ Terkirim</span>' : '<span class="pst"><span class="spin xs"></span> ' + esc(p.status || 'Mengirim…') + '</span>';
  var body = p.kind === 'file' ? '<div class="lb">' + (p.thumb ? '<img class="pthumb" src="' + esc(p.thumb) + '" alt="">' : '') + esc(p.label) + '</div>' : '<div class="lb">' + esc(p.text) + '</div>';
  return '<div class="lmsg ' + side + ' mine pend' + (p.state === 'err' ? ' perr' : '') + '" data-pend="' + p.tmp + '"><div class="lh">' + esc(String(S.user.nama).split(' ')[0]) + ' · baru saja</div>' + body + st + '</div>';
}
function tsPendHtml(d) {
  var ids = {}; d.log.forEach(function (l) { ids[l.id] = 1; });
  TSA.pend = TSA.pend.filter(function (p) { return !(p.logId && ids[p.logId]) && !(p.state === 'ok' && p.kind === 'file' && p.uploaded && d.files.some(function (f) { return f.id === p.fileId; })); });
  return TSA.pend.filter(function (p) { return p.caseId === d.t.TicketID; }).map(function (p) { return tsPendOne(p, tsPendSide(d)); }).join('');
}
function tsPendUpdate(p) {
  var el = document.querySelector('[data-pend="' + p.tmp + '"]'), d = TSA.caseData;
  if (el && d) { el.outerHTML = tsPendOne(p, tsPendSide(d)); tsBindPend(); }
}
function tsBindPend() {
  $$('.lmsg.perr').forEach(function (el) {
    el.onclick = function () { var p = TSA.pend.filter(function (x) { return x.tmp === el.dataset.pend; })[0]; if (p && p.retry) { p.state = 'send'; p.status = ''; tsPendUpdate(p); p.retry(); } };
  });
}
function tsScrollEnd() { var lg = $('#tslog'); if (lg && lg.lastElementChild) lg.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' }); }
function tsSendMsg(caseId, txt) {
  var p = { tmp: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), caseId: caseId, kind: 'msg', text: txt, state: 'send' };
  TSA.pend.push(p);
  var lg = $('#tslog');
  if (lg && TSA.caseData) { var e0 = lg.querySelector('.muted.small'); if (e0 && !lg.querySelector('.lmsg,.lsys')) e0.remove(); lg.insertAdjacentHTML('beforeend', tsPendOne(p, tsPendSide(TSA.caseData))); tsScrollEnd(); }
  p.retry = function () {
    api('tsMessage', caseId, txt).then(function (r) {
      p.state = 'ok'; p.logId = r.id; tsPendUpdate(p);
      // satu kali muat ulang saja: lewat sinkron (yang juga memperbarui daftar), kalau tidak ada perubahan baru muat langsung
      tsSyncNow().then(function (changed) { if (!changed && TSA.caseId === caseId) tsRefreshCase(); });
    },
      function (e) { p.state = 'err'; p.retry = p.retry; tsPendUpdate(p); toast(errMsg(e)); });
  };
  p.retry();
}
var TS_LOG_ITEM = [{ key: 'log', label: 'Lampiran', kind: 'any' }];
function tsAttachMenu(t) {
  var pick = function (icon, text, accept, cam) { return '<label class="pick big' + (cam ? '' : ' alt') + '">' + ic(icon) + text + '<input type="file" data-src="' + (cam ? 'cam' : 'gal') + '" accept="' + accept + '"' + (cam ? ' capture="environment"' : '') + '></label>'; };
  modal('<h3>Kirim lampiran</h3><div class="muted small" style="margin:4px 0 12px">Foto & video dikompres dan diberi watermark otomatis, lalu dikirim di latar.</div><div class="attmenu">' +
    (isTouch() ? pick('camera', 'Ambil foto', 'image/*', true) + pick('video', 'Rekam video', 'video/*', true) : '') +
    pick('folder', isTouch() ? 'Galeri foto / video' : 'Pilih foto / video', 'image/*,video/*', false) + pick('file', 'File / scan', '', false) +
    '</div><button class="btn sec block" id="amX" style="margin-top:12px">Batal</button>', 'narrow');
  $('#amX').onclick = closeModal;
  $$('.attmenu input[type=file]').forEach(function (inp) {
    inp.onchange = function () { var f = inp.files && inp.files[0]; inp.value = ''; closeModal(); if (f) tsSendFile(t, f, inp.dataset.src); };
  });
}
function tsSendFile(t, file, src) {
  var isImg = /^image\//.test(file.type || ''), isVid = /^video\//.test(file.type || '');
  var label = (isImg ? 'Foto' : isVid ? 'Video' : 'File') + ' dari ' + String(S.user.nama).split(' ')[0];
  var p = { tmp: 'p' + Date.now().toString(36), caseId: t.TicketID, kind: 'file', label: label, state: 'send', status: isImg ? 'Mengompres foto…' : isVid ? 'Menyiapkan video…' : 'Mengirim…' };
  TSA.pend.push(p);
  var lg = $('#tslog');
  if (lg && TSA.caseData) { lg.insertAdjacentHTML('beforeend', tsPendOne(p, tsPendSide(TSA.caseData))); tsScrollEnd(); }
  var F = { v: { brand: t.Brand, model: t.Model, nopol: t.Nopol, outlet: t.Outlet }, files: {}, proc: {} };
  var item = [{ key: 'log', label: label, kind: isImg ? 'image' : isVid ? 'video' : 'any' }];
  tsPickFile(F, item, 'log', file, src || 'gal', function () {
    var pr = F.proc.log, f = F.files.log;
    if (f && f.thumb) p.thumb = f.thumb;
    p.status = pr ? pr.label.replace(/ \(boleh lanjut mengisi\)|, boleh lanjut mengisi/, '') : 'Mengirim…';
    tsPendUpdate(p);
  });
  tsWaitProc(F).then(function () {
    if (!F.files.log) { p.state = 'err'; tsPendUpdate(p); return; }
    p.status = 'Mengirim…'; tsPendUpdate(p);
    var send = function () {
      tsBgUpload(t.TicketID, { log: F.files.log }, { log: label }, function (r) {
        if (r.failed.length) { p.state = 'err'; p.retry = send; tsPendUpdate(p); TSA.lastFail = null; tsPillDraw(); }
        else { p.state = 'ok'; p.done = true; TSA.pend = TSA.pend.filter(function (x) { return x !== p; }); }
      });
    };
    send();
  });
}

function tsRenderCase(m) {
  var d = TSA.caseData;
  if (!d) {
    var r0 = TSA.list.filter(function (x) { return x.id === TSA.caseId; })[0];
    m.innerHTML = r0 ? '<div class="tscasehead"><button class="hbtn" id="tsBack" aria-label="Kembali">' + ic('chev', '') + '</button><div style="flex:1;min-width:0"><div class="mono" style="font-weight:800">' + esc(r0.id) + '</div><div class="small muted">' + esc(tsVeh(r0)) + (r0.nopol ? ' · ' + esc(r0.nopol) : '') + ' · ' + esc(r0.outlet) + '</div></div>' + tsPill(r0.status) + '</div>' +
      '<div class="card"><dl class="kv">' + kv('Keluhan', r0.keluhan) + '</dl></div><div class="empty small"><div class="spin" style="margin:0 auto 8px"></div>Memuat log & foto…</div>'
      : '<div class="empty"><div class="spin" style="margin:0 auto 10px"></div>Memuat kasus…</div>';
    if ($('#tsBack')) $('#tsBack').onclick = function () { TSA.caseId = null; TSA.caseData = null; go(TSA.back || tsHome()); };
    return;
  }
  var t = d.t, F = d.flags, draftMsg = $('#lmsg') ? $('#lmsg').value : '';
  var focused = document.activeElement && document.activeElement.id === 'lmsg', caret = focused ? document.activeElement.selectionStart : 0;
  var h = '<div class="tscasehead"><button class="hbtn" id="tsBack" aria-label="Kembali">' + ic('chev', '') + '</button><div style="flex:1;min-width:0"><div class="mono" style="font-weight:800">' + esc(t.TicketID) + (t.NoLama ? ' <span class="tag">' + esc(t.NoLama) + '</span>' : '') + '</div>' +
    '<div class="small muted">' + esc(tsVeh(t)) + (t.Nopol ? ' · ' + esc(t.Nopol) : '') + ' · ' + esc(t.Outlet) + '</div></div>' + tsPill(t.Status) + '</div>';
  h += tsContactBar(d);
  h += '<div class="card" style="padding:12px 14px">' + tsProgress(t.Status) +
    '<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">' + (t.Urgent === 'TRUE' ? '<span class="pill urg">URGENT</span>' : '') + (t.Sistem ? '<span class="tag b">' + esc(t.Sistem) + '</span>' : '') +
    String(t.DTC || '').split(/,\s*/).filter(Boolean).map(function (x) { return '<span class="tag mono">' + esc(x) + '</span>'; }).join('') +
    '<span class="small muted">Teknisi: <b>' + esc(t.Teknisi || '-') + '</b></span><span class="small muted">Ditangani: <b>' + esc(t.HandlerName || 'belum') + '</b></span></div>' +
    '<dl class="kv" style="margin-top:10px">' + kv('Keluhan', t.Keluhan) + (t.ODO ? kv('ODO', Number(t.ODO).toLocaleString('id-ID') + ' km') : '') + (t.VIN ? kv('VIN', t.VIN) : '') + kv('Diminta', fmtDT(t.CreatedAt) + ' · ' + (t.Sumber || 'Aplikasi')) + '</dl>';
  if (F.staff) {
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:12px">' +
      (F.canTake ? '<button class="btn or sm" id="tTake">' + ic('user', 'sm') + (t.Handler ? ' Ambil alih' : ' Tangani') + '</button>' : '') +
      '<button class="btn sm" id="tClose">' + ic('check', 'sm') + (tsIsFinal(t.Status) ? ' Ubah hasil' : ' Selesaikan kasus') + '</button>' +
      (tsIsOpen(t.Status) ? '<select class="slim" id="tSt" style="margin:0">' + tsCfg().open.map(function (s) { return '<option' + (t.Status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' : '') +
      '<button class="btn sec sm" id="tPdf">' + ic('printer', 'sm') + ' PDF</button>' +
      (F.canAi ? '<button class="btn sec sm" id="tAi" style="color:#6d28d9">' + ic('zap', 'sm') + ' Saran AI</button>' : '') +
      '<button class="btn sec sm" id="tEdit">' + ic('edit', 'sm') + ' Ubah data</button>' +
      (t.FolderUrl ? '<a class="btn sec sm" target="_blank" rel="noopener" href="' + esc(t.FolderUrl) + '">' + ic('folder', 'sm') + ' Drive</a>' : '') +
      (F.canDelete ? '<button class="btn sec sm" id="tDel" style="color:var(--bad)">' + ic('trash', 'sm') + '</button>' : '') + '</div>';
  } else if (t.PdfUrl) h += '<div class="row" style="margin-top:12px"><button class="btn sec sm" id="tPdf">' + ic('printer', 'sm') + ' PDF report</button></div>';
  h += '</div>';
  if (t.Solusi) h += '<div class="card res"><h2><span class="hic" style="background:var(--ok-bg);color:var(--ok)">' + ic('check') + '</span>Hasil penanganan</h2><dl class="kv">' + (t.Penyebab ? kv('Penyebab', t.Penyebab) : '') + kv('Solusi', t.Solusi) + (t.PartDiganti ? kv('Part diganti', t.PartDiganti) : '') + (t.SelesaiAt ? kv('Selesai', fmtDT(t.SelesaiAt) + ' · ' + (t.SelesaiOleh || '')) : '') + '</dl></div>';
  var mainFiles = d.files.filter(function (f) { return !f.log; });
  if (mainFiles.length) h += '<div class="card"><h2><span class="hic">' + ic('camera') + '</span>Foto & lampiran</h2><div class="fgrid">' + mainFiles.map(tsFileTile).join('') + '</div></div>';
  if (d.similar && d.similar.length) h += '<details class="card simcard"><summary><b>Kasus serupa yang sudah solved</b> <span class="tag">' + d.similar.length + '</span></summary>' + d.similar.map(function (s) {
    return '<div class="simi"><span class="small muted">' + esc(s.id + ' · ' + [s.brand, s.model].filter(Boolean).join(' ') + (s.dtc ? ' · ' + s.dtc : '')) + '</span><div>' + esc(s.keluhan) + '</div><div class="ok"><b>Solusi:</b> ' + esc(s.solusi) + '</div></div>';
  }).join('') + '</details>';
  h += '<div class="sec-t" style="margin-top:6px">' + ic('list') + ' Log kasus</div><div class="tslog" id="tslog">' + (tsLogHtml(d) || '<div class="muted small">Belum ada catatan.</div>') + '</div>';
  if (F.canMsg) h += '<div class="composer"><button class="hbtn" id="lAtt" aria-label="Tambah foto / file">' + ic('camera') + '</button>' +
    '<textarea id="lmsg" rows="1" placeholder="Tulis catatan…">' + esc(draftMsg) + '</textarea><button class="hbtn send" id="lSend" aria-label="Kirim">' + ic('send') + '</button></div>' +
    (!F.staff || F.mine ? (tsCfg().ai.ready && tsCfg().ai.auto && tsCfg().ai.auto.on ? '<div class="small muted" style="text-align:center;margin:6px 0 0">🤖 Jika Tech Support belum membalas dalam ' + tsCfg().ai.auto.menit + ' menit, asisten AI membalas dulu.</div>' : '') : '');
  else h += '<div class="msg info">' + ic('check') + '<span>Kasus sudah ditutup. Jika masalah muncul lagi, buat permintaan bantuan baru.</span></div>';
  m.innerHTML = h;
  $('#tsBack').onclick = function () { TSA.caseId = null; TSA.caseData = null; go(TSA.back || tsHome()); };
  tsLoadThumbs(t.TicketID, d.files);
  var bind = function (id, fn) { var e = $(id); if (e) e.onclick = fn; };
  bind('#tTake', function () { this.disabled = true; api('tsTake', t.TicketID).then(function () { toast('Kasus Anda tangani.'); tsRefreshCase(); tsSyncNow(); }, function (e) { toast(errMsg(e)); }); });
  bind('#tClose', function () { tsCloseModal(d); });
  bind('#tPdf', function () { tsMakePdf(t.TicketID, false); });
  bind('#tEdit', function () { tsEditModal(d); });
  bind('#tAi', function () { var b = this; b.disabled = true; b.textContent = 'Meminta saran…'; api('tsAssist', t.TicketID, true).then(function (r) { toast(r.none ? 'Belum ada saran.' : 'Saran ditambahkan ke Log.'); tsRefreshCase(); }, function (e) { toast(errMsg(e)); b.disabled = false; }); });
  bind('#tDel', function () {
    confirmBox({ title: 'Hapus kasus ' + t.TicketID + '?', body: 'Data, log, dan file Drive kasus ini dihapus. Tidak bisa dibatalkan.', ok: 'Hapus', danger: true, typeWord: 'HAPUS' }).then(function (y) {
      if (!y) return; busyModal('Menghapus…');
      api('tsDelete', t.TicketID).then(function () { closeModal(); toast('Kasus dihapus.'); TSA.caseId = null; tsSyncNow(); go(TSA.back || tsHome()); }, function (e) { closeModal(); toast(errMsg(e)); });
    });
  });
  var st = $('#tSt');
  if (st) st.onchange = function () { st.disabled = true; api('tsSetStatus', t.TicketID, st.value).then(function () { toast('Status: ' + st.value); tsRefreshCase(); tsSyncNow(); }, function (e) { toast(errMsg(e)); st.disabled = false; }); };
  $$('[data-aiok]', m).forEach(function (b) { b.onclick = function () { b.disabled = true; api('tsAiApprove', b.dataset.aiok).then(function () { toast('Saran disetujui.'); tsRefreshCase(); }, function (e) { b.disabled = false; toast(errMsg(e)); }); }; });
  var send = $('#lSend');
  if (send) {
    var ta = $('#lmsg');
    var grow = function () { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
    ta.oninput = grow; grow();
    send.onclick = function () {
      var txt = ta.value.trim(); if (!txt) return;
      ta.value = ''; grow(); ta.focus();
      tsSendMsg(t.TicketID, txt);
    };
    ta.onkeydown = function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send.onclick(); } };
    $('#lAtt').onclick = function () { tsAttachMenu(t); };
    if (focused) { ta.focus(); try { ta.setSelectionRange(caret, caret); } catch (e) { /* */ } }
  }
  tsBindPend();
}
function tsMakePdf(id, regen) {
  modal('<h3>Menyiapkan PDF report…</h3><div class="muted small" style="margin:6px 0 14px">Biasanya 10–30 detik.</div><div class="spin" style="margin:0 auto"></div>', 'narrow');
  modalLock = true;
  return api('tsPdf', id, !!regen).then(function (r) {
    modalLock = false;
    modal('<h3>PDF report siap</h3><div class="muted small" style="margin:6px 0 14px;word-break:break-word">' + esc(r.name) + '</div><div class="stack">' +
      '<button class="btn or block" id="pdDl">' + ic('download') + ' Download PDF</button>' + (r.url ? '<a class="btn sec block" target="_blank" rel="noopener" href="' + esc(r.url) + '">' + ic('folder') + ' Buka di Drive</a>' : '') +
      (tsStaff() ? '<button class="btn sec block" id="pdRe">' + ic('refresh') + ' Buat ulang</button>' : '') + '<button class="btn sec block" id="pdX">Tutup</button></div>', 'narrow');
    $('#pdDl').onclick = function () { dlFile(r.name, 'application/pdf', r.b64); };
    if ($('#pdRe')) $('#pdRe').onclick = function () { tsMakePdf(id, true); };
    $('#pdX').onclick = function () { closeModal(); if (TSA.caseId === id) tsRefreshCase(); };
  }, function (e) { modalLock = false; closeModal(); toast(errMsg(e), 7000); });
}
function tsCloseModal(d) {
  var t = d.t;
  var C = { v: { solusi: t.Solusi || '', penyebab: t.Penyebab || '', part: t.PartDiganti || '', status: tsIsFinal(t.Status) ? t.Status : 'Resolved', referensi: t.Referensi !== 'FALSE', brand: t.Brand, model: t.Model, nopol: t.Nopol, outlet: t.Outlet }, files: {}, existing: {} };
  d.files.forEach(function (f) { C.existing[f.key] = f; });
  var picks = [{ key: 'solving1', label: 'Foto problem solving 1', kind: 'image' }, { key: 'solving2', label: 'Foto problem solving 2', kind: 'image' }, { key: 'solving3', label: 'Foto problem solving 3', kind: 'image' }, { key: 'video_solving', label: 'Video hasil perbaikan', kind: 'video' }];
  modal('<h3>' + (tsIsFinal(t.Status) ? 'Ubah hasil penanganan' : 'Selesaikan kasus') + '</h3><div class="muted small" style="margin:4px 0 12px">' + esc(t.TicketID + ' · ' + tsVeh(t) + ' · ' + (t.Nopol || '')) + '</div><div class="stack">' +
    '<div><label>Hasil penanganan / solusi <span class="req">*</span></label><textarea id="t_solusi" placeholder="1. …&#10;2. …">' + esc(C.v.solusi) + '</textarea></div>' +
    '<div><label>Penyebab <span class="opt">opsional</span></label><textarea id="t_penyebab" style="min-height:56px">' + esc(C.v.penyebab) + '</textarea></div>' +
    '<div><label>Part diganti <span class="opt">opsional</span></label><input type="text" id="t_part" value="' + esc(C.v.part) + '"></div>' +
    '<div><label>Status akhir</label>' + tsStatusChips(C.v.status, ['Resolved', 'Not resolved', 'Pending part', 'Dirujuk ke dealer']) + '</div>' +
    '<div><label>Foto / video problem solving</label><div id="cPicks"></div></div>' +
    '<label class="check"><input type="checkbox" id="t_ref"' + (C.v.referensi ? ' checked' : '') + '> Jadikan referensi "kasus serupa" untuk teknisi lain</label>' +
    '<div id="cErr" class="msg err hidden"></div><button class="btn or block" id="cGo">' + ic('check') + ' Simpan & buat PDF</button><button class="btn sec block" id="cX">Batal</button></div>');
  tsMountAtts($('#cPicks'), C, picks);
  $$('#t_st .chip').forEach(function (b) { b.onclick = function () { C.v.status = b.dataset.st; $$('#t_st .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
  $('#cX').onclick = closeModal;
  $('#cGo').onclick = function () {
    tsCollect(C);
    if (!String(C.v.solusi).trim()) { var e = $('#cErr'); e.innerHTML = ic('warn') + '<span>Isi hasil penanganan / solusi.</span>'; e.classList.remove('hidden'); return; }
    var b = this; b.disabled = true; b.textContent = C.proc && Object.keys(C.proc).length ? 'Menyelesaikan kompres…' : 'Menyimpan…';
    modalLock = true;
    tsWaitProc(C).then(function () { return api('tsClose', t.TicketID, C.v); }).then(function () {
      modalLock = false;
      var files = tsFilesOf(C);
      tsSyncNow();
      if (!Object.keys(files).length) return tsMakePdf(t.TicketID, true);
      closeModal(); tsRefreshCase();
      toast('Tersimpan. Foto dikirim di latar, PDF dibuat setelah foto terkirim.', 5000);
      tsBgUpload(t.TicketID, files, tsLabels(picks), function () { tsMakePdf(t.TicketID, true); });
    }).catch(function (e) { modalLock = false; if (!$('#cGo')) { toast(errMsg(e)); return; } b.disabled = false; b.innerHTML = ic('check') + ' Simpan & buat PDF'; var er = $('#cErr'); if (er) { er.innerHTML = ic('warn') + '<span>' + esc(errMsg(e)) + '</span>'; er.classList.remove('hidden'); } else toast(errMsg(e)); });
  };
}
function tsEditModal(d) {
  var t = d.t;
  var E = { v: { outlet: t.Outlet, brand: t.Brand, model: t.Model, nopol: t.Nopol, odo: t.ODO, sistem: t.Sistem, keluhan: t.Keluhan, dtc: t.DTC, urgent: t.Urgent === 'TRUE', teknisi: t.Teknisi } };
  var outs = (TSA.boot.outlets || []).slice(); if (t.Outlet && outs.indexOf(t.Outlet) < 0) outs.unshift(t.Outlet);
  modal('<h3>Ubah data kasus</h3><div class="stack" style="margin-top:12px">' + tsVehicleFields(E.v, outs, true) +
    '<div><label>Teknisi</label><input type="text" id="t_teknisi" value="' + esc(E.v.teknisi) + '"></div>' + tsSystemChips(E.v) +
    '<div><label>Keluhan</label><textarea id="t_keluhan">' + esc(E.v.keluhan) + '</textarea></div><div><label>Kode DTC</label><input type="text" id="t_dtc" class="mono" value="' + esc(E.v.dtc) + '"></div>' +
    '<label class="check"><input type="checkbox" id="t_urgent"' + (E.v.urgent ? ' checked' : '') + '> URGENT</label>' +
    '<button class="btn block" id="eGo">Simpan</button><button class="btn sec block" id="eX">Batal</button></div>');
  $$('#t_sis .chip').forEach(function (b) { b.onclick = function () { E.v.sistem = E.v.sistem === b.dataset.s ? '' : b.dataset.s; $$('#t_sis .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.s === E.v.sistem); }); }; });
  $('#eX').onclick = closeModal;
  $('#eGo').onclick = function () { tsCollect(E); var b = this; b.disabled = true; api('tsEdit', t.TicketID, E.v).then(function () { closeModal(); toast('Data disimpan.'); tsRefreshCase(); tsSyncNow(); }, function (e) { b.disabled = false; toast(errMsg(e)); }); };
}

/* ---------------- data & export ---------------- */
function tsRenderData(m) {
  var f = TSA.filter, list = TSA.list;
  var brands = {}, outlets = {};
  list.forEach(function (r) { if (r.brand) brands[r.brand] = 1; if (r.outlet) outlets[r.outlet] = 1; });
  var canExp = tsStaff() || role() === 'sm' || role() === 'foreman' || role() === 'foreman_sw';
  var h = '<div class="tshead"><div><h1>' + (tsReq() && !tsStaff() ? 'Kasus' : 'Data Tech Support') + '</h1><div class="small muted">' + list.length + ' kasus</div></div>' + (canExp ? '<button class="btn sec sm" id="tExp">' + ic('download', 'sm') + ' Excel</button>' : '') + '</div>';
  h += '<div class="search">' + ic('search') + '<input id="tq" type="search" placeholder="Cari nopol, merek, keluhan, teknisi, DTC…" value="' + esc(f.q) + '"></div>';
  var cnt = function (st) { return list.filter(function (r) { return r.status === st; }).length; };
  h += '<div class="chips">' + [['', 'Semua', list.length]].concat(TS_ST_ORDER.map(function (s) { return [s, s, cnt(s)]; })).filter(function (c) { return c[0] === '' || c[2]; })
    .map(function (c) { return '<button class="chip' + (f.status === c[0] ? ' on' : '') + '" data-s="' + esc(c[0]) + '">' + esc(c[1]) + '<b>' + c[2] + '</b></button>'; }).join('') + '</div>';
  h += '<div class="row" style="gap:8px;flex-wrap:wrap"><select class="slim" id="tb"><option value="">Semua merek</option>' + Object.keys(brands).sort().map(function (b) { return '<option' + (f.brand === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select>' +
    (Object.keys(outlets).length > 1 ? '<select class="slim" id="to"><option value="">Semua outlet</option>' + Object.keys(outlets).sort().map(function (o) { return '<option' + (f.outlet === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' : '') + '</div><div id="tlist"></div>';
  m.innerHTML = h;
  var draw = function () {
    var q = f.q.trim().toLowerCase();
    var l = list.filter(function (r) {
      if (f.status && r.status !== f.status) return false;
      if (f.brand && r.brand !== f.brand) return false;
      if (f.outlet && r.outlet !== f.outlet) return false;
      if (q && [r.id, r.no, r.nopol, r.brand, r.model, r.keluhan, r.teknisi, r.hname, r.dtc, r.sistem, r.outlet, r.solusi].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var el = $('#tlist');
    if (!l.length) { el.innerHTML = '<div class="empty">' + ic('inbox') + '<div>Tidak ada data.</div></div>'; return; }
    if (isDesk()) {
      el.innerHTML = '<table class="tbl"><thead><tr><th>Tanggal</th><th>No.</th><th>Kendaraan</th><th>Nopol</th><th>Outlet</th><th>Teknisi</th><th>Issue</th><th>Status</th><th>Handling</th></tr></thead><tbody>' + l.slice(0, 400).map(function (r) {
        return '<tr class="click" data-ts="' + esc(r.id) + '"><td>' + esc(fmtDate(r.ts)) + '</td><td class="mono">' + esc(r.no || r.id) + '</td><td>' + esc(tsVeh(r)) + '</td><td>' + esc(r.nopol) + '</td><td>' + esc(r.outlet) + '</td><td>' + esc(r.teknisi) + '</td><td style="white-space:normal;max-width:320px">' + esc(r.keluhan.slice(0, 110)) + '</td><td>' + tsPill(r.status) + '</td><td>' + esc(r.hname) + '</td></tr>';
      }).join('') + '</tbody></table>';
    } else el.innerHTML = l.slice(0, 200).map(function (r) { return tsCard(r); }).join('');
    tsBindCards(el);
  };
  $('#tq').oninput = function () { f.q = this.value; draw(); };
  $$('.chip[data-s]', m).forEach(function (b) { b.onclick = function () { f.status = b.dataset.s; $$('.chip[data-s]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }; });
  $('#tb').onchange = function () { f.brand = this.value; draw(); };
  if ($('#to')) $('#to').onchange = function () { f.outlet = this.value; draw(); };
  if ($('#tExp')) $('#tExp').onclick = tsExportXlsx;
  draw();
}
function tsExportXlsx() {
  busyModal('Menarik data…');
  apiRetry('tsExport').then(function (list) {
    closeModal();
    if (!list.length) { toast('Belum ada data.'); return; }
    var keys = Object.keys(list[0]);
    var wide = { 'Keluhan': 45, 'Solusi / Result': 50, 'Penyebab': 30, 'Folder Drive': 40, 'PDF Report': 40, 'Outlet': 24 };
    var rowsX = [keys].concat(list.map(function (r) { return keys.map(function (k) { return r[k]; }); }));
    var sum = {}; list.forEach(function (r) { var b = r.Brand || '-'; var o = sum[b] || (sum[b] = {}); o[r.Status] = (o[r.Status] || 0) + 1; o._t = (o._t || 0) + 1; });
    var ring = [['Brand'].concat(TS_ST_ORDER, ['Total'])].concat(Object.keys(sum).sort().map(function (b) { return [b].concat(TS_ST_ORDER.map(function (s) { return sum[b][s] || 0; }), [sum[b]._t]); }));
    saveBlob('TechSupport-Export-' + stampName() + '.xlsx', makeXlsx([{ name: 'Data Tech Support', rows: rowsX, widths: keys.map(function (k) { return wide[k] || 16; }) }, { name: 'Ringkasan Brand', rows: ring, widths: [20, 10, 12, 14, 12, 14, 18, 10] }]));
  }, function (e) { closeModal(); toast(errMsg(e)); });
}

/* ---------------- dashboard ---------------- */
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
function tsRenderDash(m) {
  var D = TSA.dash, now = new Date();
  var from = D.range === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : D.range === '3m' ? new Date(now.getFullYear(), now.getMonth() - 2, 1) : D.range === 'year' ? new Date(now.getFullYear(), 0, 1) : null;
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var list = TSA.list.filter(function (r) { return (!from || r.ts >= iso(from)) && (!D.brand || r.brand === D.brand); });
  var by = function (st) { return list.filter(function (r) { return r.status === st; }).length; };
  var tot = list.length, res = by('Resolved'), ana = by('Analysis') + by('Baru'), part = by('Pending part'), not = by('Not resolved') + by('Dirujuk ke dealer');
  var brands = {}; TSA.list.forEach(function (r) { if (r.brand) brands[r.brand] = 1; });
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
    list.slice(0, 25).map(function (r) {
      var stCell = tsStaff() ? '<select class="stsel" data-sid="' + esc(r.id) + '">' + TS_ST_ORDER.map(function (s) { return '<option' + (r.status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' : tsPill(r.status);
      return '<tr><td>' + esc(fmtDate(r.ts)) + '</td><td class="mono"><a href="#" data-ts="' + esc(r.id) + '">' + esc(r.no || r.id) + '</a></td><td>' + esc(tsVeh(r)) + '</td><td>' + esc(r.nopol) + '</td><td>' + esc(r.outlet) + '</td><td style="white-space:normal;min-width:180px">' + esc(r.keluhan.slice(0, 90)) + '</td><td>' + stCell + '</td><td>' +
        (r.pdf || tsStaff() ? '<button class="btn sec sm" data-pdf="' + esc(r.id) + '">' + ic('printer', 'sm') + '</button>' : '-') + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
  m.innerHTML = h;
  $('#dr').onchange = function () { D.range = this.value; tsRenderDash(m); };
  $('#db').onchange = function () { D.brand = this.value; tsRenderDash(m); };
  $$('.kpi', m).forEach(function (b) { b.onclick = function () { TSA.filter.status = b.dataset.f; TSA.filter.brand = D.brand; go('ts:data'); }; });
  $$('[data-ts]', m).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); tsOpen(a.dataset.ts); }; });
  $$('[data-pdf]', m).forEach(function (b) { b.onclick = function () { tsMakePdf(b.dataset.pdf, false); }; });
  $$('.stsel', m).forEach(function (s) {
    var prev = s.value;
    s.onchange = function () {
      var v = s.value; s.disabled = true;
      api('tsSetStatus', s.dataset.sid, v).then(function () { toast('Status ' + s.dataset.sid + ': ' + v); prev = v; tsSyncNow(); }, function (e) { toast(errMsg(e), 6000); s.value = prev; }).finally(function () { s.disabled = false; });
    };
  });
}

/* ---------------- admin Tech Support ---------------- */
function renderTsAdmin(el) {
  el.innerHTML = '<div class="empty"><div class="spin" style="margin:0 auto 10px"></div>Memuat pengaturan Tech Support…</div>';
  if (!serverAtLeast('2.5')) { el.innerHTML = '<div class="msg warn">' + ic('warn') + '<span>Server belum versi 2.5. Tempel Code.gs terbaru di Apps Script lalu Terapkan versi baru.</span></div>'; return; }
  apiRetry('tsAdminGet').then(function (a) { S.techNames = a.users.map(function (u) { return u.nama; }); tsAdminDraw(el, a); }, function (e) { el.innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
}
function tsAdminDraw(el, a) {
  var c = a.cfg, team = c.team.slice();
  var users = a.users.filter(function (u) { return u.role !== 'mekanik_sw' && u.role !== 'foreman_sw'; });
  var h = '<div class="card"><h2><span class="hic or">' + ic('users') + '</span>Tim Tech Support</h2><div class="small muted" style="margin:-6px 0 10px">Anggota tim melihat semua kasus Tech Support, menerima notifikasi, dan nomor WA-nya dipakai untuk tombol URGENT. Admin otomatis punya akses tim.</div><div id="tmList"></div>' +
    '<div class="two" style="margin-top:10px"><div><label>Tambah akun</label><select id="tmU"><option value="">Pilih akun…</option>' + users.filter(function (u) { return !team.some(function (t) { return t.username === u.username; }); }).map(function (u) { return '<option value="' + esc(u.username) + '">' + esc(u.nama + ' (' + roleName(u.role) + ')') + '</option>'; }).join('') + '</select></div>' +
    '<div><label>Nomor WhatsApp</label><input type="text" id="tmW" inputmode="tel" placeholder="08xxxxxxxxxx"></div></div><div style="margin-top:8px"><label>Peran</label><input type="text" id="tmP" value="Technical Support"></div>' +
    '<button class="btn sec block" id="tmAdd" style="margin-top:10px">' + ic('plus') + ' Tambah anggota</button></div>';
  var prov = a.aiProvider || 'gemini', keys = a.aiKeys || {}, back = a.aiCadangan || '', MD = a.aiModels || {};
  var PV = a.aiProviders || [{ id: 'gemini', name: 'Gemini', model: 'gemini-3.8-flash' }, { id: 'claude', name: 'Claude', model: 'claude-sonnet-5-5' }];
  var pvName = function (id) { var x = PV.filter(function (p) { return p.id === id; })[0]; return x ? x.name : id; };
  var onNow = c.ai.on && !!keys[prov];
  AIS = { level: a.aiLevel || 'seimbang', model: c.ai.model || '' };
  h += '<div class="card"><h2><span class="hic" style="background:#f3efff;color:#6d28d9">' + ic('zap') + '</span>Asisten AI <span class="pill ' + (onNow ? 'done' : 'draft') + '">' + (onNow ? 'ON · ' + esc(pvName(prov)) + (back ? ' + ' + esc(pvName(back)) : '') : 'OFF') + '</span></h2>' +
    '<div class="small muted" style="margin:-6px 0 10px">Saat OFF, saran tetap muncul gratis dari <b>kasus serupa</b>. Data yang dikirim ke AI hanya merek, model, sistem, keluhan & DTC (tanpa nopol, nama, foto).</div>' +
    '<label>Tambah / ganti API key</label><div class="pwf"><input type="password" id="aiK" autocomplete="off" placeholder="Tempel API key apa saja di sini"><button type="button" class="eye" aria-label="Tampilkan">' + ic('eye') + '</button></div>' +
    '<button class="btn sec block" id="aiDet" style="margin-top:8px">' + ic('search', 'sm') + ' Kenali & simpan key</button>' +
    '<div class="small muted" style="margin-top:4px">Aplikasi mengenali sendiri key dari Gemini, Claude, OpenAI, Groq, OpenRouter atau DeepSeek, lalu mengambil daftar model di akun lu.</div><div id="aiDetRes"></div>' +
    '<label style="margin-top:12px">Penyedia utama</label><div class="aiprov">' +
    [['off', 'Mati', 'Kasus serupa saja']].concat(PV.map(function (p) { return [p.id, p.id === 'claude' ? 'Claude API' : p.name, (TS_AI_INFO[p.id] || {}).d || '']; })).map(function (x) {
      var on = x[0] === 'off' ? !c.ai.on : c.ai.on && prov === x[0];
      return '<label class="aiopt' + (on ? ' on' : '') + (x[0] !== 'off' && !keys[x[0]] ? ' nokey' : '') + '"><input type="radio" name="aip" value="' + x[0] + '"' + (on ? ' checked' : '') + '><b>' + esc(x[1]) + (x[0] !== 'off' && keys[x[0]] ? ' <span class="kdot" title="Key tersimpan">●</span>' : '') + '</b><small>' + esc(x[0] !== 'off' && !keys[x[0]] ? 'Belum ada key' : x[2]) + '</small></label>';
    }).join('') + '</div>' +
    '<div id="aiKeyBox"></div>' +
    '<div id="aiMore"><label style="margin-top:10px">Level AI</label><div class="ailevel" id="aiLv"></div>' +
    '<label>Model <span class="opt">ikuti level, atau pilih sendiri</span></label><select id="aiM"></select>' +
    '<label>Penyedia cadangan <span class="opt">dipakai otomatis bila penyedia utama penuh / error</span></label><select id="aiB"></select>' +
    '<label style="margin-top:10px">Saran AI dikirim</label>' +
    '<label class="check"><input type="radio" name="aim" value="langsung"' + (c.ai.mode !== 'draf' ? ' checked' : '') + '> <span><b>Langsung ke teknisi</b>, berlabel "belum dicek"</span></label>' +
    '<label class="check"><input type="radio" name="aim" value="draf"' + (c.ai.mode === 'draf' ? ' checked' : '') + '> <span><b>Draf untuk Tech Support dulu</b>, teknisi melihat setelah disetujui</span></label>' +
    '<label class="check" style="margin-top:8px"><input type="checkbox" id="aiAuto"' + ((c.ai.auto || {}).on !== false ? ' checked' : '') + '> <span><b>Balas otomatis</b> pesan teknisi bila Tech Support belum membalas dalam ' +
    '<select id="aiMenit" class="stsel" style="display:inline-block;margin:0 4px">' + [3, 5, 10, 15, 30].map(function (n) { return '<option value="' + n + '"' + (((c.ai.auto || {}).menit || 5) === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select> menit</span></label></div>' +
    '<div id="aiTestRes"></div><div class="row" style="margin-top:10px;gap:8px"><button class="btn block" id="aiSave">Simpan asisten AI</button><button class="btn sec" id="aiTest">' + ic('zap', 'sm') + ' Tes</button></div></div>';
  h += '<div class="card"><h2><span class="hic" style="background:var(--bad-bg);color:var(--bad)">' + ic('warn') + '</span>Kasus URGENT</h2>' +
    '<label class="check"><input type="checkbox" id="urB"' + (c.urgent.buttons !== false ? ' checked' : '') + '> Tampilkan tombol Telepon &amp; WhatsApp</label>' +
    '<label>Pesan WA otomatis</label><textarea id="urT" style="min-height:70px">' + esc(c.urgent.template || '') + '</textarea><div class="small muted">Kode: {id} {kendaraan} {nopol} {outlet} {keluhan} {link}</div><button class="btn sec block" id="urSave" style="margin-top:10px">Simpan</button></div>';
  h += '<div class="card"><h2><span class="hic">' + ic('car') + '</span>Daftar merek & sistem</h2><div class="two"><div><label>Merek (1 per baris)</label><textarea id="lsB" style="min-height:160px">' + esc(c.brands.join('\n')) + '</textarea></div>' +
    '<div><label>Sistem (1 per baris)</label><textarea id="lsS" style="min-height:160px">' + esc(c.systems.join('\n')) + '</textarea></div></div><button class="btn sec block" id="lsSave" style="margin-top:10px">Simpan daftar</button></div>';
  h += '<div class="card"><h2><span class="hic">' + ic('upload') + '</span>Import data Google Form lama</h2><div class="small muted" style="margin:-6px 0 10px">Pilih file CSV dari sheet "Form Responses 1" (File → Download → CSV). Baris yang sudah pernah diimport dilewati. Link foto & PDF lama tetap dipakai.</div>' +
    '<input type="file" id="imF" accept=".csv,text/csv" class="hidden"><button class="btn sec block" id="imGo">' + ic('upload') + ' Pilih file CSV</button><div id="imRes"></div></div>';
  h += '<div class="card"><h2><span class="hic">' + ic('zap') + '</span>Cek kecepatan</h2><div class="small muted" style="margin:-6px 0 10px">Mengukur bagian mana yang lambat: koneksi HP, antrean server Google, atau pembacaan data.</div><button class="btn sec block" id="spGo">' + ic('zap') + ' Mulai cek</button><div id="spRes"></div></div>';
  h += '<div class="card"><h2><span class="hic">' + ic('folder') + '</span>Data</h2><div class="small">Total kasus: <b>' + a.total + '</b></div><div class="stack" style="margin-top:10px"><a class="btn sec block" target="_blank" rel="noopener" href="' + esc(a.dbUrl) + '">' + ic('file') + ' Buka spreadsheet TECHNICAL SUPPORT DB</a><a class="btn sec block" target="_blank" rel="noopener" href="' + esc(a.folderUrl) + '">' + ic('folder') + ' Buka folder Drive TECHNICAL SUPPORT</a></div></div>';
  el.innerHTML = h;
  var drawTeam = function () {
    $('#tmList').innerHTML = team.length ? team.map(function (t, i) {
      return '<div class="tmrow"><span class="avatar" style="background:var(--orange-d);width:36px;height:36px;font-size:13px">' + esc(initials(t.nama)) + '</span><span style="flex:1;min-width:0"><b>' + esc(t.nama) + '</b><div class="small muted">@' + esc(t.username) + ' · ' + esc(t.peran || 'Technical Support') + '</div>' +
        '<input type="text" inputmode="tel" class="tmwa" data-i="' + i + '" value="' + esc(t.wa || '') + '" placeholder="Nomor WA"></span>' +
        '<span class="stack" style="gap:6px;align-items:flex-end"><label class="check" style="margin:0;font-size:12.5px"><input type="checkbox" class="tmon" data-i="' + i + '"' + (t.aktif !== false ? ' checked' : '') + '> aktif</label><button class="xbtn" data-tdel="' + i + '" style="color:var(--bad)">Hapus</button></span></div>';
    }).join('') + '<button class="btn block" id="tmSave" style="margin-top:10px">Simpan tim</button>' : '<div class="muted small">Belum ada anggota. Admin tetap bisa menangani kasus.</div>';
    $$('.tmwa').forEach(function (x) { x.oninput = function () { team[+x.dataset.i].wa = x.value; }; });
    $$('.tmon').forEach(function (x) { x.onchange = function () { team[+x.dataset.i].aktif = x.checked; }; });
    $$('[data-tdel]').forEach(function (b) { b.onclick = function () { team.splice(+b.dataset.tdel, 1); saveTeam(); }; });
    if ($('#tmSave')) $('#tmSave').onclick = saveTeam;
  };
  var save = function (part, val, btn) {
    if (btn) btn.disabled = true;
    return api('tsAdminSave', part, val).then(function (na) { toast('Tersimpan.'); tsAdminDraw(el, na); tsLoad(true); }, function (e) { toast(errMsg(e), 6000); if (btn) btn.disabled = false; });
  };
  var saveTeam = function () { save('team', team, $('#tmSave')); };
  drawTeam();
  $('#tmAdd').onclick = function () {
    var un = $('#tmU').value; if (!un) { toast('Pilih akun dulu.'); return; }
    var u = a.users.filter(function (x) { return x.username === un; })[0];
    team.push({ username: un, nama: u ? u.nama : un, peran: $('#tmP').value.trim() || 'Technical Support', wa: $('#tmW').value.trim(), aktif: true });
    saveTeam();
  };
  var curP = function () { var x = $$('[name=aip]').filter(function (r) { return r.checked; })[0]; return x ? x.value : 'off'; };
  var LV = [['hemat', 'Hemat', 'Cepat & irit kuota'], ['seimbang', 'Seimbang', 'Disarankan'], ['terbaik', 'Terbaik', 'Paling pintar, lebih lambat']];
  var drawKey = function () {
    var p = curP(), box = $('#aiKeyBox');
    $$('.aiopt').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
    $('#aiMore').style.display = p === 'off' ? 'none' : '';
    $('#aiTest').style.display = p === 'off' ? 'none' : '';
    if (p === 'off') { box.innerHTML = ''; return; }
    var nm = pvName(p), k = keys[p], inf = TS_AI_INFO[p] || {}, md = MD[p] || { levels: {}, list: [] };
    box.innerHTML = '<div class="msg ' + (k ? 'ok' : 'warn') + '">' + ic(k ? 'check' : 'key') + '<span>' + (k ? 'API key ' + esc(nm) + ' terpasang (' + esc(k) + ')' + (md.list.length ? ' · ' + md.list.length + ' model tersedia' : '') + '.' : 'Belum ada API key ' + esc(nm) + '. Tempel key di kolom atas.') +
      '<br><small>' + esc(inf.note || '') + (inf.url ? ' Buat key di <a href="https://' + inf.url + '" target="_blank" rel="noopener">' + esc(inf.url) + '</a>.' : '') + '</small></span></div>' +
      (k ? '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sec sm" id="aiRf">' + ic('refresh', 'sm') + ' Perbarui daftar model</button><button class="btn sec sm" id="aiKD" style="color:var(--bad)">' + ic('trash', 'sm') + ' Hapus key</button></div>' : '');
    $('#aiLv').innerHTML = LV.map(function (l) {
      return '<button type="button" class="lvb' + (AIS.level === l[0] && !AIS.model ? ' on' : '') + '" data-lv="' + l[0] + '"><b>' + l[1] + '</b><small>' + esc(l[2]) + '</small><code>' + esc((md.levels || {})[l[0]] || '-') + '</code></button>';
    }).join('');
    $$('#aiLv [data-lv]').forEach(function (b) { b.onclick = function () { AIS.level = b.dataset.lv; AIS.model = ''; drawKey(); }; });
    var list = (md.list || []).slice();
    if (AIS.model && list.indexOf(AIS.model) < 0) list.unshift(AIS.model);
    $('#aiM').innerHTML = '<option value="">Ikuti level (' + esc((md.levels || {})[AIS.level] || '-') + ')</option>' + list.map(function (m) { return '<option' + (AIS.model === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('');
    $('#aiM').onchange = function () { AIS.model = this.value; drawKey(); };
    var bs = $('#aiB'), cur = bs.dataset.init ? bs.value : back; bs.dataset.init = '1';
    bs.innerHTML = '<option value="">Tidak ada</option>' + PV.filter(function (x) { return x.id !== p; }).map(function (x) {
      return '<option value="' + x.id + '"' + (keys[x.id] ? '' : ' disabled') + (cur === x.id && keys[x.id] ? ' selected' : '') + '>' + esc(x.name) + (keys[x.id] ? '' : ' (belum ada key)') + '</option>';
    }).join('');
    if ($('#aiRf')) $('#aiRf').onclick = function () { var b = this; b.disabled = true; api('tsAiRefresh', p).then(function (na) { toast('Daftar model ' + nm + ' diperbarui.'); tsAdminDraw(el, na); }, function (e) { b.disabled = false; toast(errMsg(e), 6000); }); };
    if ($('#aiKD')) $('#aiKD').onclick = function () {
      confirmBox({ title: 'Hapus API key ' + nm + '?', body: 'Asisten ' + nm + ' berhenti. Saran tetap muncul dari kasus serupa.', ok: 'Hapus', danger: true }).then(function (y) {
        if (y) api('tsAdminSave', 'aikey', { provider: p, key: '' }).then(function (na) { toast('API key dihapus.'); tsAdminDraw(el, na); tsLoad(true); }, function (e) { toast(errMsg(e)); });
      });
    };
  };
  $$('[name=aip]').forEach(function (r) { r.onchange = function () { AIS.model = ''; drawKey(); }; });
  drawKey();
  $('#aiDet').onclick = function () {
    var v = $('#aiK').value.trim(), b = this;
    if (!v) { toast('Tempel API key dulu.'); return; }
    b.disabled = true; $('#aiDetRes').innerHTML = '<div class="msg info"><span class="spin xs"></span><span>Mengenali key & mengambil daftar model…</span></div>';
    api('tsAiDetect', v).then(function (na) {
      var d = na.detected;
      tsAdminDraw(el, na);
      var r = $$('[name=aip]').filter(function (x) { return x.value === d.provider; })[0];
      if (r && (curP() === 'off' || !na.cfg.ai.on)) { r.checked = true; r.dispatchEvent(new Event('change')); }
      $('#aiDetRes').innerHTML = '<div class="msg ok">' + ic('check') + '<span><b>Terdeteksi: ' + esc(d.name) + '</b> · ' + d.count + ' model tersedia. Key tersimpan.<br><small>Hemat: ' + esc(d.levels.hemat) + ' · Seimbang: ' + esc(d.levels.seimbang) + ' · Terbaik: ' + esc(d.levels.terbaik) + '</small><br><small>Pilih penyedia & level di bawah lalu tekan <b>Simpan asisten AI</b>.</small></span></div>';
      $('#aiDetRes').scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, function (e) { b.disabled = false; $('#aiDetRes').innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
  };
  $('#aiSave').onclick = function () {
    var p = curP(), md = $$('[name=aim]').filter(function (x) { return x.checked; })[0];
    save('ai', { on: p !== 'off', provider: p === 'off' ? prov : p, cadangan: p === 'off' ? back : $('#aiB').value, level: AIS.level, model: AIS.model, mode: md ? md.value : 'langsung', auto: { on: $('#aiAuto').checked, menit: +$('#aiMenit').value } }, this);
  };
  $('#aiTest').onclick = function () {
    var b = this, p = curP(); b.disabled = true; $('#aiTestRes').innerHTML = '<div class="msg info"><span class="spin xs"></span><span>Menghubungi ' + esc(pvName(p)) + '…</span></div>';
    api('tsAiTest', p).then(function (r) { $('#aiTestRes').innerHTML = '<div class="msg ok">' + ic('check') + '<span><b>Berhasil</b> · ' + esc(r.provider + ' ' + r.model) + (r.utama && r.utama !== r.model ? ' (model ' + esc(r.utama) + ' sedang penuh, otomatis pakai cadangan)' : '') + ' · ' + Math.round(r.ms / 100) / 10 + ' dtk<br>"' + esc(r.sample) + '"<br><small>Tes memakai pengaturan yang sudah disimpan.</small></span></div>'; },
      function (e) { $('#aiTestRes').innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; }).finally(function () { b.disabled = false; });
  };
  $('#urSave').onclick = function () { save('urgent', { buttons: $('#urB').checked, template: $('#urT').value }, this); };
  $('#lsSave').onclick = function () {
    var b = this;
    save('brands', $('#lsB').value, null).then(function () { return api('tsAdminSave', 'systems', $('#lsS').value); }).then(function (na) { if (na) { tsAdminDraw(el, na); tsLoad(true); } }, function (e) { toast(errMsg(e)); b.disabled = false; });
  };
  $('#spGo').onclick = function () { tsSpeedCheck(this); };
  $('#imGo').onclick = function () { $('#imF').click(); };
  $('#imF').onchange = function () {
    var file = this.files && this.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var rowsIn;
      try { rowsIn = tsParseLegacyCsv(String(r.result)); } catch (e) { $('#imRes').innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; return; }
      confirmBox({ title: 'Import ' + rowsIn.length + ' baris?', body: 'Data Google Form lama akan ditambahkan ke Tech Support. Baris yang sudah ada dilewati.', ok: 'Import' }).then(function (y) {
        if (!y) return;
        busyModal('Mengimport…');
        api('tsImport', rowsIn).then(function (res) {
          closeModal();
          $('#imRes').innerHTML = '<div class="msg ok">' + ic('check') + '<span>' + res.added + ' kasus ditambahkan, ' + res.skipped + ' dilewati (sudah ada)' + (res.bad ? ', ' + res.bad + ' baris tidak lengkap' : '') + '. ' + res.files + ' link foto.</span></div>';
          tsLoad(true);
        }, function (e) { closeModal(); $('#imRes').innerHTML = '<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'; });
      });
    };
    r.readAsText(file);
    this.value = '';
  };
}
var AIS = { level: 'seimbang', model: '' };
function tsSpeedCheck(btn) {
  var res = $('#spRes'), rows = [];
  btn.disabled = true;
  var fmt = function (ms) { return ms >= 1000 ? (ms / 1000).toFixed(1).replace('.', ',') + ' dtk' : ms + ' ms'; };
  var lvl = function (ms, ok, warn) { return ms <= ok ? 'ok' : ms <= warn ? 'warn' : 'bad'; };
  var draw = function (extra) {
    res.innerHTML = '<table class="tbl sp" style="margin-top:10px"><thead><tr><th>Langkah</th><th>Waktu</th><th>Keterangan</th></tr></thead><tbody>' + rows.map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td><span class="spd ' + r[2] + '">' + esc(fmt(r[1])) + '</span></td><td class="small">' + esc(r[3] || '') + '</td></tr>';
    }).join('') + '</tbody></table>' + (extra || '');
  };
  var call = function (label, action, args, ok, warn) {
    var t0 = Date.now();
    return api.apply(null, [action].concat(args || [])).then(function (d) {
      var rt = Date.now() - t0, last = (S.msLog || []).filter(function (x) { return x.a === action; }).pop(), srv = last && last.srv ? last.srv.total : null;
      rows.push([label, rt, lvl(rt, ok, warn), srv !== null ? 'server bekerja ' + fmt(srv) + ', sisanya ' + fmt(Math.max(0, rt - srv)) + ' koneksi/antrean Google' : '']);
      draw(); return d;
    }, function (e) { rows.push([label, Date.now() - t0, 'bad', errMsg(e)]); draw(); });
  };
  res.innerHTML = '<div class="msg info" style="margin-top:10px"><span class="spin xs"></span><span>Mengukur… (± 20–40 detik)</span></div>';
  call('Respon server (ping)', 'ping', [], 1500, 3500)
    .then(function () { return call('Buka aplikasi (VTAG)', 'bootstrap', [], 3000, 6000); })
    .then(function () { return call('Buka Tech Support', 'tsBoot', [], 3000, 6000); })
    .then(function () { var r = TSA.list[0]; return r ? call('Buka 1 kasus TS', 'tsGet', [r.id], 2500, 5000) : null; })
    .then(function () { return api('tsSpeed'); })
    .then(function (parts) {
      var body = '<div class="sec-t" style="margin-top:12px">Rincian di server</div><table class="tbl sp"><tbody>' + (parts || []).map(function (p) {
        return '<tr><td>' + esc(p.bagian) + '</td><td><span class="spd ' + lvl(p.ms, 700, 2000) + '">' + esc(fmt(p.ms)) + '</span></td><td class="small">' + esc(p.info) + '</td></tr>';
      }).join('') + '</tbody></table>';
      var slow = rows.filter(function (r) { return r[2] === 'bad'; }).length;
      var ping = rows[0] ? rows[0][1] : 0;
      var tip = ping > 3500 ? 'Respon server dasar (ping) sudah lambat: penyebabnya koneksi internet HP/laptop atau server Google sedang sibuk, bukan data aplikasi.'
        : slow ? 'Ada langkah yang lambat. Lihat rincian server di bawah: baris berwarna merah adalah bagian yang paling makan waktu.' : 'Semua langkah dalam batas wajar untuk Apps Script.';
      draw('<div class="msg ' + (slow || ping > 3500 ? 'warn' : 'ok') + '" style="margin-top:10px">' + ic(slow ? 'warn' : 'check') + '<span>' + esc(tip) + '</span></div>' + body +
        '<button class="btn sec sm" id="spCopy" style="margin-top:10px">' + ic('file', 'sm') + ' Salin hasil</button>');
      $('#spCopy').onclick = function () {
        var txt = rows.map(function (r) { return r[0] + ': ' + fmt(r[1]) + (r[3] ? ' (' + r[3] + ')' : ''); }).concat((parts || []).map(function (p) { return p.bagian + ': ' + fmt(p.ms) + ' ' + p.info; })).join('\n');
        try { navigator.clipboard.writeText(txt); toast('Hasil disalin. Tempel ke chat Claude.'); } catch (e) { toast('Tidak bisa menyalin.'); }
      };
    }, function (e) { draw('<div class="msg err">' + ic('warn') + '<span>' + esc(errMsg(e)) + '</span></div>'); })
    .finally(function () { btn.disabled = false; });
}
var TS_AI_INFO = {
  gemini: { d: 'Gratis (Google)', note: 'Tier gratis: Google boleh memakai data untuk mengembangkan produknya.', url: 'aistudio.google.com/apikey' },
  claude: { d: 'Berbayar, paling akurat', note: 'Bayar sesuai pemakaian.', url: 'console.anthropic.com/settings/keys' },
  openai: { d: 'Berbayar (ChatGPT)', note: 'Bayar sesuai pemakaian.', url: 'platform.openai.com/api-keys' },
  groq: { d: 'Ada tier gratis, cepat', note: 'Tier gratis dengan batas pemakaian per menit/hari.', url: 'console.groq.com/keys' },
  openrouter: { d: 'Ada model gratis', note: 'Model "openrouter/free" memilih model gratis secara otomatis.', url: 'openrouter.ai/keys' },
  deepseek: { d: 'Berbayar murah', note: 'Bayar sesuai pemakaian (isi saldo dulu).', url: 'platform.deepseek.com/api_keys' }
};
/** CSV RFC 4180 sederhana (kutip ganda, baris baru di dalam sel). */
function tsCsv(text) {
  var rows = [], row = [], cell = '', q = false;
  text = String(text).replace(/^﻿/, '');
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
}
function tsParseLegacyCsv(text) {
  var rows = tsCsv(text);
  if (rows.length < 2) throw new Error('File CSV kosong.');
  var hd = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = function (re) { for (var i = 0; i < hd.length; i++) if (re.test(hd[i])) return i; return -1; };
  var C = {
    timestamp: col(/^timestamp$/), no: col(/^no$/), tanggal: col(/^tanggal$/), type: col(/^type kendaraan/), plat: col(/^plat/), outlet: col(/^outlet$/),
    teknisi: col(/^technician|^teknisi/), handler: col(/^support handling/), issue: col(/^issue/), result: col(/^result$/), status: col(/^status$/),
    pdf: col(/^merged doc url/), depan: col(/^foto detail/), problem: col(/^foto problem$/), s1: col(/^foto problem solving 1/), s2: col(/^foto problem solving 2/)
  };
  if (C.issue < 0 || C.plat < 0) throw new Error('Kolom "Issue Description" / "Plat Nomor" tidak ditemukan. Pastikan CSV dari Form Responses TECHNICAL ISSUE.');
  var g = function (r, i) { return i >= 0 ? String(r[i] || '').trim() : ''; };
  return rows.slice(1).map(function (r) {
    var foto = [];
    [['depan', C.depan, 'Foto Detail Kendaraan'], ['problem', C.problem, 'Foto Problem'], ['solving1', C.s1, 'Foto Problem Solving 1'], ['solving2', C.s2, 'Foto Problem Solving 2']].forEach(function (x) { var u = g(r, x[1]); if (u) foto.push({ key: x[0], url: u, label: x[2] }); });
    return { timestamp: g(r, C.timestamp), no: g(r, C.no), tanggal: g(r, C.tanggal), type: g(r, C.type), plat: g(r, C.plat), outlet: g(r, C.outlet), teknisi: g(r, C.teknisi), handler: g(r, C.handler), issue: g(r, C.issue), result: g(r, C.result), status: g(r, C.status), pdfUrl: g(r, C.pdf), foto: foto };
  }).filter(function (r) { return r.issue; });
}
