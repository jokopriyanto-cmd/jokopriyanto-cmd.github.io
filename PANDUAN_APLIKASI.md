# Panduan: Web App VTAG → Aplikasi HP (PWA + APK Android)

Isi folder ini:
- `index.html`: pembungkus aplikasi (splash Otoklix + menampilkan web app Apps Script)
- `manifest.webmanifest`: nama, ikon, warna aplikasi
- `sw.js`: service worker supaya aplikasi bisa diinstal dan cepat dibuka
- `icons/`: ikon aplikasi dari logo Otoklix
- `.nojekyll`: wajib ikut di-upload (supaya folder `.well-known` bisa dibaca GitHub Pages)

Link web app sudah diisi di `index.html` (variabel `APP_URL`).

---

## 0. Syarat di Apps Script (sekali saja)
Terapkan → Kelola deployment → ikon pensil → **Yang memiliki akses: Siapa saja** → Terapkan.
Kalau masih "harus login Google", aplikasi akan kosong. Jika opsi "Siapa saja" diblokir admin Otoklix,
ubah di `index.html`: `var MODE = 'redirect';` (aplikasi akan membuka web app di browser).

## 1. Upload ke GitHub Pages
1. Login GitHub → **New repository**.
   - Nama repo **disarankan: `USERNAME.github.io`** (ganti USERNAME dengan username GitHub Anda).
     Dengan nama ini, link aplikasi jadi `https://USERNAME.github.io/`. Ini penting untuk APK, agar bilah alamat hilang (langkah 3).
   - Kalau repo `USERNAME.github.io` sudah dipakai untuk hal lain, buat repo biasa (mis. `vtag-app`).
     Linknya jadi `https://USERNAME.github.io/vtag-app/`. Aplikasi tetap jalan, hanya di APK akan ada bilah alamat tipis di atas.
   - Pilih **Public** → Create repository.
2. Klik **uploading an existing file** → seret SEMUA isi folder ini (termasuk folder `icons` dan file `.nojekyll`) → **Commit changes**.
   - Kalau `.nojekyll` tidak terlihat di komputer (file tersembunyi), buat manual: Add file → Create new file → nama `.nojekyll` → kosongkan → Commit.
3. Buka **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.
4. Tunggu 1–2 menit, buka linknya. Splash Otoklix muncul lalu halaman login web app.

## 2. Instal di HP (Android & iPhone), tanpa APK
- **Android (Chrome):** buka link → muncul tombol/menu **Instal aplikasi** (atau ⋮ → Instal aplikasi / Tambahkan ke layar utama).
- **iPhone (Safari):** buka link → tombol **Bagikan** → **Tambahkan ke Layar Utama**.

Ikon Otoklix muncul di layar HP dan aplikasi terbuka layar penuh.

## 3. Buat file APK Android
1. Buka **https://www.pwabuilder.com** → tempel link GitHub Pages Anda → **Start**.
2. Klik **Package For Stores** → **Android** → **Generate Package**.
   - Package ID: misalnya `com.otoklix.vtag`
   - App name: `Otoklix Workshop Investigation`, Short name: `VTAG Otoklix`
   - Signing key: **Create new** (isi nama & organisasi)
3. **Download** → file zip berisi:
   - `*.apk`: untuk dipasang langsung ke HP (bagikan via WhatsApp/Drive)
   - `*.aab`: untuk upload ke Google Play Store (jika nanti mau)
   - `signing.keystore` + `signing-key-info.txt`: **SIMPAN BAIK-BAIK**, wajib untuk membuat versi APK berikutnya
   - `assetlinks.json`
4. Upload `assetlinks.json` ke repo GitHub di folder **`.well-known/`**
   (Add file → Create new file → ketik nama `.well-known/assetlinks.json` → tempel isinya → Commit).
   Ini membuat bilah alamat di APK hilang (harus di repo `USERNAME.github.io`).
5. Pasang APK di HP: buka file APK → izinkan **Instal aplikasi tidak dikenal** → Instal.

## 4. Kalau ada update
- **Update fitur (Code.gs / Index.html di Apps Script):** cukup Terapkan versi baru di Apps Script. Aplikasi (PWA & APK) otomatis ikut, **tidak perlu** upload ulang ke GitHub atau membuat APK baru.
- Upload ulang ke GitHub hanya kalau link /exec berubah atau ikon/nama aplikasi diganti.

## Catatan
- Aplikasi butuh internet (data tersimpan di Google Sheet & Drive).
- Di iPhone, login kadang perlu diulang setiap aplikasi dibuka (pembatasan Safari).
- Tombol **Unduh** hasil cetak form di dalam aplikasi mungkin tidak jalan di sebagian HP. Gunakan link **Buka di Drive** pada layar yang sama.
