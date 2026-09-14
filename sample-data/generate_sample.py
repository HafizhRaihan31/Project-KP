"""
Membuat contoh spreadsheet data proyek (sesuai struktur BA Drop LOP) untuk
dites dengan aplikasi doc-generator. Header kolom sengaja dibuat sama persis
dengan yang diharapkan backend (lihat sheetsService.js), supaya bisa langsung
diimpor ke Google Sheets dan dicoba tanpa ubah-ubah kode dulu.
"""
import openpyxl
from openpyxl.styles import Font

HEADERS = [
    "NO", "WOK", "Tipe Desain", "Nama Proyek", "Keterangan Drop",
    "IHLD Lop ID", "Jml ODP", "Jml Port", "Total BOQ",
]

ROWS = [
    (1, "SMG-1", "PT3BR", "PT3BR-25-WLR-FA-KENDAL_22024_H2_2025",
     "Warga RT01/RW09 Desa Sumber Agung tidak mengizinkan penambahan tiang",
     12325183, 4, 32, "20,603,316"),
    (2, "SMG-2", "PT3BR", "PT3BR-25-SMC-FC-SMG2_SMC_SEKARANGNPATI",
     "Hasil review DBAD = DROP, kenaikan RAB 41,99%, OVER CPP",
     11387359, 3, 24, "27,533,951"),
    (3, "SMG-2", "PT3BR", "PT3BR-25-MJP-FBS-SMG2_MJP_JATIKUSUMAN",
     "Hasil review DBAD = DROP, kenaikan RAB 46,65%, OVER CPP",
     11445964, 4, 32, "31,611,928"),
    (4, "SMG-2", "PT3BR", "PT3BR-25-MJP-FEW-YOYOK KARYOAO",
     "Hasil review DBAD = DROP, kenaikan RAB 42,35%, OVER CPP",
     11487181, 3, 24, "27,151,419"),
    (5, "DEMAK", "PT3BR", "PT3BR-25-UNR-FAT-SMG_DMK_LEYANGAN",
     "Hasil review DBAD = DROP, kenaikan RAB 31,17%, OVER CPP",
     12505347, 3, 24, "22,454,233"),
    (6, "SMG-2", "PT3BR", "PT3BR-25-MJP-FBZ-SMG2_MJP_PUCANGPENI",
     "Hasil review DBAD = DROP, kenaikan RAB 51,62%, OVER CPP",
     11383015, 3, 24, "25,184,252"),
    (7, "SMG-2", "PT3BR", "PT3BR-25-MJP-FEN-BATURKEBONBATUR",
     "Warga menolak adanya penanaman tiang",
     11445578, 4, 32, "35,234,491"),
    (8, "SMG-2", "PT3BR", "PT3BR-25-GNK-FF-DEMAK_85391_H2_2025",
     "Hasil review DBAD = DROP, kenaikan RAB 168,59%, OVER CPP",
     12120552, 2, 16, "14,060,663"),
    (9, "SMG-2", "PT3BR", "PT3BR-26-BMK-FBS-APC-GREENLAND VICTORY",
     "Belum ada kesepakatan / belum deal dengan pihak Developer, confirm by Tsel Branch",
     12919000, 3, 24, "60,484,477"),
    (10, "SMG-2", "PT3BR", "PT3BR-26-MJP-FEA-APC TEMBALANG HIGHLAND",
     "PKS & administrasi belum clear dengan pihak developer, confirm by Tsel Branch",
     12918953, 2, 16, "9,136,702"),
    (11, "SMG-1", "PT3BR", "PT3BR-26-BOJ-FW-ANDARAGRANDORCHID",
     "Sudah PKS dengan provider lain, tidak diperbolehkan ada tiang & tarikan baru, confirm by Tsel branch",
     12918659, 4, 32, "30,660,221"),
    (12, "DEMAK", "PT3BR", "PT3BR-25-UNR-FEB-ODP-UNR-FEB_13",
     "Hasil review DBAD = DROP, Kenaikan RAB 159,05%, OVER CPP",
     12135477, 5, 40, "72,852,737"),
    (13, "SMG-1", "PT3BR", "PT3BR-25-WLR-FQ-ODP-KDL-FAC_057",
     "Kenaikan RAB 228,34%, OVER CPP",
     12135246, 6, 48, "47,025,461"),
    (14, "SMG-2", "PT3BR", "PT3BR-25-MJP-FL-SMG2_MJP_BATURSARI1",
     "Kenaikan RAB 60,58%, kompensasi tinggi, OVER CPP",
     11483109, 8, 64, "84,626,723"),
    (15, "SMG-2", "PT3BR", "PT3BR-25-MJP-FL-SMG2_MJP_AMALTA4",
     "Kenaikan RAB 70,62%, OVER CPP",
     11482983, 3, 24, "21,070,926"),
    (16, "PATI", "PT3BR", "MD-PT3-PAT-FS-PATI_85189_H2_2025",
     "Hasil review DBAD = DROP, kenaikan RAB 18,42%, OVER CPP",
     12090449, 3, 24, "48,778,327"),
    (17, "KUDUS", "PT3BR", "MD-PT3-KUD-FAW-KUDUS_40042_H2_2025",
     "Hasil review DBAD = DROP, kenaikan RAB 182,19%, OVER CPP",
     12210445, 1, 8, "15,612,599"),
    (18, "KUDUS", "PT3BR", "MD-PT3-BAN-FD-BAN_BONDO 14",
     "Hasil review DBAD = DROP, kenaikan RAB 724,82%, OVER CPP",
     11253289, 8, 64, "206,859,823"),
    (19, "SMG-1", "PT3BR", "PT3BR-25-WLR-FK-KENDAL_128737",
     "Hasil review DBAD = DROP, kenaikan RAB 136,53%, OVER CPP",
     12224179, 5, 48, "97,700,295"),
    (20, "DEMAK", "PT3BR", "PT3BR-25-ABR-FL-SEMARANG_32190_H2_2025",
     "Kompensasi recurring, warga meminta free wifi selamanya, Over CPP",
     12393254, 2, 16, "18,127,198"),
    (21, "DEMAK", "PT3", "MD-PT3-DMA-FH-DEMAK_13792",
     "Tidak di ijinkan Penanaman tiang oleh warga",
     11468898, 4, 32, "55,757,681"),
    (22, "DEMAK", "PT3", "MD-PT3-DMA-FN-PT2LS_DEMAK_DMA_BOLO1",
     "Tidak di ijinkan Penanaman tiang oleh warga",
     11449254, 12, 96, "77,399,781"),
    (23, "JPR", "PT3", "MD-PT3-PEC-FA-250_-2976_7009",
     "Hasil review DBAD = DROP, kenaikan RAB 669%, OVER CPP",
     12546442, 2, 16, "44,327,889"),
    (24, "SMG-2", "PT3BR", "PT3BR-25-MJP-FCA-SMG2_MJP_TELUK",
     "Kades & warga tidak mengizinkan penarikan jaringan, karena masih ada masalah dengan operator sebelumnya",
     11619966, 20, 160, "287,328,319"),
    (25, "SMG-1", "PT3BR", "PT3BR-25-WLR-FE-KENDAL_21950_H2_2025",
     "Drop, dependensi dengan LOP PT3BR-25-WLR-FK-KENDAL_128737 yg drop karena QE penambahan feeder tidak di approve DBAD",
     12090493, 6, 48, "53,336,735"),
    (26, "SMG-1", "PT3BR", "PT3BR-25-WLR-FK-ODP-WLR-FK_079",
     "Drop, dependensi dengan LOP PT3BR-25-WLR-FK-KENDAL_128737 yg drop karena QE penambahan feeder tidak di approve DBAD",
     11625651, 4, 32, "31,642,504"),
    (27, "SMG-1", "PT3", "PT3-25-WLR-FK-BATANG_145710_H2_2025",
     "Drop, dependensi dengan LOP PT3BR-25-WLR-FK-KENDAL_128737 yg drop karena QE penambahan feeder tidak di approve DBAD",
     12355169, 3, 24, "31,520,132"),
    (28, "PATI", "PT3", "MD-PT3-PAT-FG-APC PERUM KUSUMA",
     "Tidak diizinkan warga untuk tanam tiang arah perumahan",
     12423360, 4, 32, "43,730,526"),
]

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Data Proyek"

FONT = "Arial"

for col_idx, header in enumerate(HEADERS, start=1):
    cell = ws.cell(row=1, column=col_idx, value=header)
    cell.font = Font(name=FONT, bold=True)

for row_idx, row_data in enumerate(ROWS, start=2):
    for col_idx, value in enumerate(row_data, start=1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.font = Font(name=FONT)

# Lebar kolom biar enak dibaca
widths = [4, 8, 12, 40, 45, 12, 9, 9, 14]
for i, w in enumerate(widths, start=1):
    ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w

ws.freeze_panes = "A2"

wb.save("sample-data-proyek.xlsx")
print("Selesai: sample-data-proyek.xlsx")
