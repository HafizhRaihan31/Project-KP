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

/**
 * Susun data yang dibutuhkan template dari daftar baris proyek terpilih.
 * `items` dipakai untuk loop tabel, sisanya untuk placeholder biasa.
 */
export function buildTemplateData(rows) {
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
