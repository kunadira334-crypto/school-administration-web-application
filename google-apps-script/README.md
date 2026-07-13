# SIM MI Mambaul Ulum Sumberduren — Google Apps Script

Sistem administrasi sekolah berbasis **Google Apps Script + Google Spreadsheet (database) + Google Drive (storage)**
untuk Yayasan Mambaul Ulum, khususnya MI Mambaul Ulum Sumberduren.

## Isi Folder
| File | Fungsi |
|---|---|
| `Code.js` | Seluruh logika backend (auth, CRUD, kehadiran, surat, upload logo) |
| `Index.html` | Shell utama aplikasi (SPA), memuat semua fragment HTML lain |
| `Stylesheet.html` | CSS aplikasi (modern, responsif) |
| `JavaScriptClient.html` | Semua logika client-side (google.script.run, navigasi, render tabel) |
| `Login.html` | Form login |
| `AdminDashboard.html` | Semua halaman khusus admin (dashboard, data sekolah, kelas, siswa, users, template, cetak surat, rekap, log) |
| `TeacherDashboard.html` | Semua halaman khusus wali kelas (dashboard, data siswa, input kehadiran, rekap) |
| `Settings.html` | Halaman pengaturan logo & profil sekolah/surat |
| `PrintLetter.html` | Referensi struktur/layout surat cetak (opsional, hanya dokumentasi) |

## 1. Cara Pemasangan
1. Buat **Google Spreadsheet** baru → beri nama misalnya `DB_MI_MambaulUlum`.
2. Menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs` bawaan, buat file script bernama **Code** lalu tempel isi `Code.js`.
4. Buat file HTML baru untuk masing-masing: `Index`, `Stylesheet`, `JavaScriptClient`, `Login`,
   `AdminDashboard`, `TeacherDashboard`, `Settings`, `PrintLetter` — salin isi file yang bersesuaian.
   (Nama file di Apps Script **harus persis** tanpa ekstensi `.html`, karena dipanggil lewat `include('NamaFile')`.)
5. Di editor Apps Script, jalankan fungsi **`setupSpreadsheet`** sekali (pilih fungsi di dropdown → klik ▶️ Run).
   - Akan meminta otorisasi akses Spreadsheet & Drive → klik **Allow**.
   - Fungsi ini otomatis membuat seluruh sheet, header kolom, folder Drive, akun default, dan data contoh.

## 2. Menjalankan sebagai Web App
1. Klik **Deploy → New deployment**.
2. Pilih tipe **Web app**.
3. Isi:
   - Description: `SIM MI Mambaul Ulum v1`
   - Execute as: **Me (email Anda)**
   - Who has access: **Anyone** (atau *Anyone within domain* jika pakai Google Workspace sekolah)
4. Klik **Deploy**, salin **Web app URL**.
5. Bagikan URL tersebut ke Admin dan Wali Kelas.
6. Setiap kali Anda mengubah kode, buat **New deployment** lagi (atau gunakan "Manage deployments → Edit → New version") agar perubahan aktif di URL yang sama.

## 3. Struktur Sheet Google Spreadsheet
Dibuat otomatis oleh `setupSpreadsheet()`:

| Sheet | Kolom |
|---|---|
| `Users` | username, password (hash SHA-256), role (`admin`/`wali_kelas`), nama, kelas, aktif, createdAt |
| `Settings` | key, value (profil yayasan, alamat, logo, kepala madrasah, dst — format key-value) |
| `Kelas 1` … `Kelas 6A`, `Kelas 6B` | id, nis, nisn, nama, jenisKelamin, kelas, namaOrtu, noHpOrtu, alamat, aktif |
| `Kehadiran` | id, tanggal, kelas, siswaId, nama, status (Hadir/Izin/Sakit/Alpha), catatan, inputOleh, createdAt |
| `Template Surat` | id, judul, isi (mendukung placeholder `{{...}}`), aktif |
| `Log Aktivitas` | timestamp, username, aksi, detail |

> Catatan: setiap kelas (1–5, 6A, 6B) memiliki **sheet roster siswa sendiri** sesuai permintaan. Data kehadiran
> disatukan dalam satu sheet `Kehadiran` dengan kolom `kelas` agar rekap & filter lintas kelas mudah dilakukan oleh admin,
> namun wali kelas tetap hanya bisa melihat/menulis data pada kelasnya sendiri (dibatasi di `Code.js`).

## 4. Google Drive
`setupSpreadsheet()` otomatis membuat folder:
```
SIM_MI_MambaulUlum_Files/
 ├─ Logo/          → hasil upload logo sekolah & logo surat
 └─ Arsip Surat/   → arsip PDF surat izin yang tercetak
```
ID folder disimpan di **Script Properties** (`ROOT_FOLDER_ID`, `LOGO_FOLDER_ID`, `SURAT_FOLDER_ID`).

## 5. Menambah Akun Admin / Wali Kelas
Setelah login sebagai admin:
1. Buka menu **Akun Pengguna**.
2. Klik **+ Tambah Akun**.
3. Isi username, password, nama, pilih role:
   - `Admin` → akses penuh.
   - `Wali Kelas` → wajib pilih **Kelas Diampu** (1, 2, 3, 4, 5, 6A, atau 6B).
4. Klik **Simpan**.

Atau langsung menambah baris baru di sheet `Users` (password harus di-hash SHA-256 — gunakan fungsi
`hashPassword('passwordAnda')` dari editor Apps Script lalu salin hasilnya).

## 6. Akun & Data Contoh (dibuat otomatis oleh setupSpreadsheet)
| Username | Password | Role | Kelas |
|---|---|---|---|
| `admin` | `admin123` | Admin | - |
| `wali1` | `wali123` | Wali Kelas | 1 |
| `wali2` | `wali123` | Wali Kelas | 2 |
| `wali3` | `wali123` | Wali Kelas | 3 |
| `wali4` | `wali123` | Wali Kelas | 4 |
| `wali5` | `wali123` | Wali Kelas | 5 |
| `wali6a` | `wali123` | Wali Kelas | 6A |
| `wali6b` | `wali123` | Wali Kelas | 6B |

Contoh siswa juga otomatis ditambahkan pada `Kelas 1` dan `Kelas 6A` untuk keperluan uji coba
(3 siswa masing-masing kelas). Silakan tambah data siswa lain melalui menu **Data Siswa**.

**⚠️ Segera ganti password default setelah instalasi**, melalui menu Akun Pengguna → Edit.

## 7. Fitur Ringkas
- **Login** berbasis token session (`CacheService`, 6 jam) tersimpan di `localStorage` browser.
- **Admin**: kelola data sekolah, kelas, siswa, wali kelas/pengguna, pengaturan logo & surat, template surat,
  cetak surat izin otomatis (arsip ke Drive + cetak/PDF via browser), rekap kehadiran semua kelas, log aktivitas.
- **Wali Kelas**: hanya melihat/menginput data pada kelas yang diampu (dibatasi di sisi server, bukan hanya UI).
- **Kehadiran**: input harian per kelas (Hadir/Izin/Sakit/Alpha + catatan), rekap per siswa & per kelas,
  filter tanggal/kelas/status.
- **Surat izin otomatis**: seluruh elemen (logo, nama yayasan/madrasah, alamat, isi, kepala madrasah, dsb)
  dapat diubah admin lewat menu Pengaturan & Template Surat.
- **Keamanan**: validasi role di setiap fungsi server (`requireAuth`), log aktivitas tiap aksi penting,
  password di-hash, wali kelas tidak bisa mengakses kelas lain (validasi server-side).

## 8. Kustomisasi Lanjutan
- Ganti warna tema di `Settings.html`/`Stylesheet.html` (variabel CSS `--primary`).
- Tambah field siswa baru: tambahkan ke `STUDENT_HEADERS` (Code.js) dan form `AdminDashboard.html`.
- Tambah status kehadiran baru: ubah pilihan `<select>` di `TeacherDashboard.html` serta `getAttendanceRecap()`.
