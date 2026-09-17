import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

/**
 * Angka di spreadsheet sering berupa string dengan pemisah ribuan
 * ("20,603,316" atau "18.127.198"). Fungsi ini menyisakan digitnya saja.
 */
function parseNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const digitsOnly = value.toString().replace(/[^\d]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

function formatNumber(value) {
  return value.toLocaleString("id-ID");
}

function cleanText(value, fallback = "", maxLength = 250) {
  const text = String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return (text || fallback).slice(0, maxLength);
}

function numberToWords(value) {
  const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  const number = Math.floor(Number(value));
  if (number < 12) return units[number];
  if (number < 20) return `${numberToWords(number - 10)} Belas`;
  if (number < 100) return `${numberToWords(Math.floor(number / 10))} Puluh ${numberToWords(number % 10)}`.trim();
  if (number < 200) return `Seratus ${numberToWords(number - 100)}`.trim();
  if (number < 1000) return `${numberToWords(Math.floor(number / 100))} Ratus ${numberToWords(number % 100)}`.trim();
  if (number < 2000) return `Seribu ${numberToWords(number - 1000)}`.trim();
  if (number < 1000000) return `${numberToWords(Math.floor(number / 1000))} Ribu ${numberToWords(number % 1000)}`.trim();
  return String(number);
}

export function formatReportDate(value) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    ? new Date(`${value}T00:00:00Z`)
    : new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[parsed.getUTCDay()]} Tanggal ${numberToWords(parsed.getUTCDate())} Bulan ${months[parsed.getUTCMonth()]} Tahun ${numberToWords(parsed.getUTCFullYear())}`;
}

/**
 * Susun data yang dibutuhkan template dari daftar baris proyek terpilih.
 * `items` dipakai untuk loop tabel, sisanya untuk placeholder biasa.
 */
export function buildTemplateData(rows, reportDetails = {}) {
  const items = rows.map((row, index) => ({
    no: index + 1,
    wok: row.wok || "",
    tipeDesain: row.tipeDesain || "",
    namaProyek: row.namaProyek || "",
    keteranganDrop: row.keteranganDrop || "",
    ihldLopId: row.ihldLopId || "",
    jmlOdp: row.jmlOdp || "",
    jmlPort: row.jmlPort || "",
    totalBoq: formatNumber(parseNumber(row.totalBoq)),
  }));

  const totalOdp = rows.reduce((sum, r) => sum + parseNumber(r.jmlOdp), 0);
  const totalPort = rows.reduce((sum, r) => sum + parseNumber(r.jmlPort), 0);
  const totalBoq = rows.reduce((sum, r) => sum + parseNumber(r.totalBoq), 0);

  const today = new Date();
  const fallbackTitle = [...new Set(rows.map((row) => row.namaProyek).filter(Boolean))].join(", ");

  return {
    items,
    jumlahLop: rows.length,
    totalOdp: formatNumber(totalOdp),
    totalPort: formatNumber(totalPort),
    totalBoq: formatNumber(totalBoq),
    tanggalDibuat: today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    judulProyek: cleanText(reportDetails.projectTitle, fallbackTitle),
    nomorKontrak: cleanText(reportDetails.contractNumber, "-", 100),
    nomorSp: cleanText(reportDetails.spNumber, "-", 100),
    pelaksana: cleanText(reportDetails.executor, "PT. TELKOM AKSES", 150),
    district: cleanText(reportDetails.district, "Semarang", 100),
    tanggalBeritaAcara: formatReportDate(reportDetails.reportDate),
  };
}

/**
 * Isi template .docx dengan data, kembalikan sebagai Buffer.
 */
export function renderDocx(templatePath, data) {
  const content = fs.readFileSync(path.resolve(templatePath), "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({ type: "nodebuffer" });
}

/**
 * Convert Buffer docx -> Buffer pdf lewat LibreOffice headless.
 * Butuh LibreOffice ter-install di server (lihat README).
 *
 * Di Linux/Mac, library ini biasanya otomatis ketemu binary soffice.
 * Di Windows, kalau LibreOffice diinstall ke lokasi default, ini juga
 * biasanya otomatis jalan. Kalau tidak ketemu (error ENOENT / ada tulisan
 * "soffice" not found), isi LIBREOFFICE_PATH di .env dengan path lengkap
 * ke soffice.exe, dan kode ini akan pakai path itu secara eksplisit.
 */
export async function convertDocxToPdf(docxBuffer) {
  // Lazy import: startup, test, dan output DOCX tidak perlu mendeteksi
  // instalasi LibreOffice. Dependency baru dimuat ketika PDF diminta.
  const { default: libre } = await import("libreoffice-convert");
  const customPath = process.env.LIBREOFFICE_PATH;

  return new Promise((resolve, reject) => {
    const callback = (err, result) => {
      if (err) return reject(err);
      resolve(result);
    };

    if (customPath) {
      return libre.convertWithOptions(docxBuffer, ".pdf", undefined, {
        sofficeBinaryPaths: [customPath],
      }, callback);
    }

    libre.convert(docxBuffer, ".pdf", undefined, callback);
  });
}
