# Sample Data Proyek

File `sample-data-proyek.xlsx` berisi 28 baris data contoh dengan struktur
kolom yang sama persis dengan yang dipakai project ini (NO, WOK, Tipe
Desain, Nama Proyek, Keterangan Drop, IHLD Lop ID, Jml ODP, Jml Port,
Total BOQ). Datanya diambil dari contoh dokumen BA Drop LOP yang sudah ada.

Gunakan file ini untuk **coba dulu aplikasinya** sebelum dihubungkan ke
spreadsheet asli milik PM.

## Cara pakai

1. Buka https://sheets.google.com → **File > Import** → upload
   `sample-data-proyek.xlsx` → pilih "Insert new sheet(s)" atau ganti
   spreadsheet baru sepenuhnya.
2. Setelah terbuka sebagai Google Sheet, ambil ID spreadsheet-nya dari URL:
   ```
   https://docs.google.com/spreadsheets/d/INI_ID_NYA/edit
   ```
3. Share spreadsheet itu ke email Service Account (lihat README utama,
   bagian "Setup Google Sheets API"), minimal akses **Viewer**.
4. Isi `SPREADSHEET_ID` di `backend/.env` dengan ID tsb, dan
   `SHEET_RANGE` dengan nama sheet & rentang selnya, misal:
   ```
   SHEET_RANGE=Data Proyek!A1:I29
   ```
5. Jalankan backend & frontend seperti biasa (lihat README utama) — daftar
   28 proyek ini akan langsung muncul di tabel web app, dan siap dicoba
   generate ke Word/PDF.

Kalau sudah lancar dengan data contoh ini, tinggal ganti `SPREADSHEET_ID`
dan `SHEET_RANGE` ke spreadsheet asli PM (dan sesuaikan mapping kolom di
`backend/src/services/sheetsService.js` kalau nama/urutan kolomnya beda).
