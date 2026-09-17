# Doc Generator — Otomatisasi Laporan Proyek dari Google Sheets

Software untuk generate dokumen Word/PDF (mis. Berita Acara Drop LOP) secara
otomatis dari data yang ada di Google Sheets, berdasarkan proyek yang dipilih
user.

## Struktur project

```
doc-generator/
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── googleAuth.js    # koneksi ke Google Sheets pakai Service Account
│   │   ├── services/
│   │   │   ├── sheetsService.js # ambil & cache data dari Google Sheets
│   │   │   └── docService.js    # isi template docx + convert ke pdf
│   │   ├── routes/
│   │   │   ├── projects.js      # GET /api/projects, POST /api/projects/refresh
│   │   │   └── generate.js      # POST /api/generate
│   │   └── server.js
│   ├── templates/
│   │   └── ba-drop-template.docx  # template Word contoh (siap pakai)
│   ├── .env.example
│   └── package.json
├── frontend/                    # React (Vite) — UI pilih proyek & download
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── sample-data/
    ├── sample-data-proyek.xlsx  # 28 baris data contoh untuk uji coba cepat
    └── README.md                # cara import ke Google Sheets & pakai
```

> **Mau coba cepat tanpa data asli dulu?** Lihat `sample-data/README.md` —
> ada 28 baris data contoh (struktur sama seperti BA Drop) yang tinggal
> diimpor ke Google Sheets untuk langsung dites end-to-end.

## Cara kerja singkat

1. Frontend memanggil `GET /api/projects` → backend ambil data dari Google
   Sheets (di-cache di memory, refresh tiap 5 menit atau manual).
2. User centang beberapa baris proyek di tabel, lalu klik **Download Word**
   atau **Download PDF**.
3. Frontend kirim `POST /api/generate` dengan daftar ID proyek yang dicentang.
4. Backend ambil baris-baris tsb, hitung total (jumlah LOP, total BOQ, dst),
   isi ke template `.docx` (baris tabel otomatis memanjang sesuai jumlah
   data lewat mekanisme *loop* di docxtemplater).
5. Kalau diminta PDF, hasil `.docx` dikonversi ke PDF pakai LibreOffice
   headless di server. File dikirim balik ke browser untuk didownload.

## Yang perlu diinstall

### 1. Node.js
Versi 18 LTS ke atas. Cek dengan `node -v`.

### 2. LibreOffice (hanya kalau butuh output PDF)
Dipakai untuk convert docx → pdf di server. Word tetap bisa digenerate
tanpa LibreOffice — ini cuma dibutuhkan untuk tombol "Download PDF".

**Ubuntu/Debian:**
```bash
sudo apt install libreoffice
```

**Windows — langkah detailnya:**

1. Download installer dari https://www.libreoffice.org/download/download/
   (pilih versi Windows, biasanya file `.msi`).
2. Jalankan installer, **biarkan lokasi instalasi default** (jangan diubah)
   — defaultnya `C:\Program Files\LibreOffice`. Ini penting karena library
   Node yang dipakai (`libreoffice-convert`) mencari LibreOffice di lokasi
   itu secara otomatis lewat environment variable `PROGRAMFILES` bawaan
   Windows.
3. **Tidak perlu jalankan apa-apa secara manual setelah install** — tidak
   perlu buka aplikasinya, tidak perlu bikin shortcut. Cukup ter-install
   saja di komputer/server yang sama dengan tempat `backend` dijalankan.
4. Untuk memastikan instalasinya benar, buka **Command Prompt** lalu jalankan:
   ```cmd
   "C:\Program Files\LibreOffice\program\soffice.exe" --version
   ```
   Kalau muncul versi LibreOffice, berarti sudah terpasang dengan benar.
5. Restart aplikasi backend (`npm run dev`) setelah LibreOffice terpasang,
   supaya environment variable ter-load ulang.
6. Coba klik **Download PDF** di web app. Percobaan **pertama kali** biasanya
   agak lambat (LibreOffice bikin profil konfigurasi baru di background) —
   ini normal, percobaan berikutnya akan lebih cepat.

**Kalau tetap error** (muncul pesan semacam `ENOENT` atau "soffice not
found") — biasanya karena LibreOffice diinstall ke folder custom (bukan
default), atau di komputer itu ada banyak versi Office lain yang bikin
env variable-nya tidak standar. Solusinya, isi `LIBREOFFICE_PATH` di
`backend/.env` dengan path lengkap ke `soffice.exe`, contoh:
```
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe
```
Kode backend sudah disiapkan untuk otomatis pakai path ini kalau diisi,
jadi PM tinggal edit `.env`, tidak perlu ubah kode sama sekali.

**Mac:** download dari libreoffice.org, install ke `/Applications`
seperti aplikasi Mac pada umumnya — otomatis terdeteksi tanpa setting
tambahan.

### 3. Dependencies tiap folder

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Setup Google Sheets API (Service Account) — dilakukan sekali

1. Buka https://console.cloud.google.com → buat project baru (atau pakai yang
   sudah ada).
2. Aktifkan **Google Sheets API** (menu "APIs & Services" → "Enable APIs").
3. Buat **Service Account** ("IAM & Admin" → "Service Accounts" → "Create").
4. Buat key baru untuk service account itu, pilih tipe **JSON** → file akan
   terdownload otomatis.
5. Buka file JSON tsb, salin nilai `client_email` dan `private_key` ke file
   `.env` (lihat `.env.example`).
6. Buka spreadsheet yang mau dipakai → klik **Share** → tempel email service
   account (yang formatnya `xxx@xxx.iam.gserviceaccount.com`) → beri akses
   **Viewer**. Tanpa langkah ini, backend tidak akan bisa baca data.

## Menjalankan project

### Konfigurasi login

Backend melindungi data proyek dan proses generate dengan satu password aplikasi.
Tambahkan nilai berikut ke `backend/.env`:

```env
APP_PASSWORD=password_yang_kuat_dan_unik
SESSION_SECRET=string_acak_minimal_32_karakter
```

Session disimpan dalam cookie `HttpOnly` dan berlaku selama 5 jam. Buat secret
acak di Linux dengan `openssl rand -hex 32`. Jangan commit file `.env` ke Git.

```bash
# terminal 1
cd backend
cp .env.example .env   # lalu isi sesuai kredensial Anda
npm run dev

# terminal 2
cd frontend
npm run dev
```

Buka browser ke alamat yang ditampilkan `npm run dev` di frontend (biasanya
`http://localhost:5173`).

### Testing lokal tanpa Google Sheets

Salin `backend/.env.example` menjadi `backend/.env`. Konfigurasi contoh sudah
memakai `USE_SAMPLE_DATA=true`, sehingga aplikasi membaca tiga proyek dari
`backend/sample-data/projects.json` dan tidak membutuhkan kredensial Google.

```bash
cd backend
npm test
```

Setelah itu jalankan backend dan frontend dengan perintah di atas. Download
Word dapat langsung dites. Download PDF tetap memerlukan LibreOffice.

## Yang perlu disesuaikan ke kebutuhan asli

- **Struktur kolom spreadsheet**: sesuaikan `SHEET_RANGE` di `.env` dan
  mapping kolom di `backend/src/services/sheetsService.js` dengan nama
  kolom asli di spreadsheet PM.
- **Template Word**: edit langsung `backend/templates/ba-drop-template.docx`
  di Microsoft Word / LibreOffice Writer. Placeholder pakai format
  `{namaVariabel}`, dan baris tabel yang mau di-loop dibungkus
  `{#items}` (di sel pertama baris) dan `{/items}` (di sel terakhir baris) —
  lihat isi template contoh untuk polanya. Tidak perlu sentuh kode kalau
  cuma ganti format/tampilan dokumen.
- **Multi-spreadsheet**: kalau nanti ada banyak spreadsheet, tambahkan daftar
  `{key, spreadsheetId, range}` di `sheetsService.js` lalu loop saat fetch,
  atau simpan daftar itu di satu sheet "index" yang dibaca duluan.
- **Hosting**: untuk dipakai tim PM sehari-hari, deploy backend+frontend ke
  Railway/Render (gratis/murah, auto-restart, tidak perlu urus server
  manual). Pastikan environment LibreOffice ikut tersedia di platform yang
  dipilih (Railway/Render bisa install via `apt` di build step / Docker).
