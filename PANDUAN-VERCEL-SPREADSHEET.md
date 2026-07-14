# Panduan Deploy Vercel + Google Spreadsheet

Versi ini sudah diubah agar aplikasi React di Vercel membaca dan menulis data melalui Vercel Serverless API ke Google Spreadsheet. `localStorage` hanya dipakai untuk menyimpan sesi login, bukan sebagai database.

## 1. Yang sudah disiapkan

- API serverless pada `api/index.js`.
- Login tervalidasi dari sheet `Users`.
- Data siswa tersimpan pada `Kelas 1` sampai `Kelas 6B`, dengan kolom nama ayah dan nama ibu terpisah.
- Data kehadiran tersimpan per kelas pada `Kehadiran 1` sampai `Kehadiran 6B`.
- Pengguna, pengaturan, template surat, kehadiran, log, dan arsip surat tersimpan di Spreadsheet.
- Pembatasan wali kelas dilakukan di server.
- Sheet dan header yang belum ada dibuat otomatis.
- Password disimpan sebagai hash SHA-256, kompatibel dengan versi Google Apps Script sebelumnya.

## 2. Bagikan Spreadsheet ke service account

1. Buka file JSON service account.
2. Salin nilai `client_email`.
3. Buka Google Spreadsheet lalu klik **Bagikan**.
4. Tambahkan email service account sebagai **Editor**.

Aktifkan **Google Sheets API** pada project Google Cloud yang sama. Aktifkan juga **Google Drive API** jika ingin mengunggah logo.

## 3. Ambil nilai environment

Dari URL berikut:

`https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/edit`

salin bagian `ID_SPREADSHEET`.

Dari file JSON service account, salin:

- `client_email`
- `private_key`, lengkap dari BEGIN PRIVATE KEY sampai END PRIVATE KEY.

## 4. Masukkan Environment Variables di Vercel

Buka **Vercel > Project > Settings > Environment Variables**, lalu tambahkan:

| Nama | Isi |
|---|---|
| `GOOGLE_SPREADSHEET_ID` | ID Spreadsheet |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` dari JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` lengkap dari JSON |
| `GOOGLE_DRIVE_FOLDER_ID` | Opsional, hanya untuk upload logo |

Aktifkan untuk Production, Preview, dan Development. Jangan memakai awalan `VITE_` pada variabel tersebut.

### Upload logo opsional

1. Buat folder Google Drive untuk logo.
2. Bagikan folder tersebut kepada email service account sebagai Editor.
3. Salin ID folder dari URL Drive.
4. Masukkan sebagai `GOOGLE_DRIVE_FOLDER_ID`.

## 5. Upload ke GitHub

Buka Terminal di folder project, lalu jalankan:

```powershell
git init
git add .
git commit -m "Integrasi Vercel dengan Google Spreadsheet"
git branch -M main
git remote add origin URL_REPOSITORY_GITHUB
git push -u origin main
```

Jika repository sebelumnya sudah terhubung:

```powershell
git add .
git commit -m "Integrasi Vercel dengan Google Spreadsheet"
git push
```

File JSON service account dan `.env` tidak boleh dimasukkan ke GitHub.

## 6. Deploy di Vercel

Gunakan pengaturan:

- Framework Preset: **Vite**
- Root Directory: `./`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Setelah environment variables disimpan, lakukan **Redeploy** tanpa build cache.

## 7. Login awal

Jika sheet `Users` sebelumnya dibuat oleh `setupSpreadsheet`, gunakan akun yang sudah ada. Jika sheet masih kosong, API otomatis membuat:

- Username: `admin`
- Password: `admin123`

Segera ganti password awal dari menu Akun Pengguna.

## 8. Sheet yang digunakan

- `Users`
- `Settings`
- `Template Surat`
- `Kehadiran 1`, `Kehadiran 2`, `Kehadiran 3`, `Kehadiran 4`, `Kehadiran 5`, `Kehadiran 6A`, `Kehadiran 6B`
- `Log Aktivitas`
- `Arsip Surat`
- `Kelas 1`, `Kelas 2`, `Kelas 3`, `Kelas 4`, `Kelas 5`, `Kelas 6A`, `Kelas 6B`

Nama sheet dan header jangan diubah.

## 9. Pemeriksaan setelah deploy

1. Buka URL Vercel.
2. Login sebagai admin.
3. Tambahkan satu siswa uji.
4. Buka Spreadsheet dan refresh sheet kelasnya.
5. Ubah pengaturan sekolah dan periksa sheet `Settings`.
6. Login sebagai wali kelas dan masukkan kehadiran.
7. Periksa sheet kehadiran sesuai kelas, misalnya `Kehadiran 1`.

Jika muncul pesan environment belum lengkap, periksa kembali ketiga variabel Google di Vercel dan lakukan Redeploy.
