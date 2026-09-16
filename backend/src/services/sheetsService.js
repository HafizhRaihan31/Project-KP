import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { getSheetsClient } from "../config/googleAuth.js";

dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "Sheet1!A1:I1000";
const CACHE_TTL_MS = 5 * 60 * 1000; 
const USE_SAMPLE_DATA = process.env.USE_SAMPLE_DATA === "true";
const SAMPLE_DATA_PATH = process.env.SAMPLE_DATA_PATH || "sample-data/projects.json";

let cache = {
  rows: [],
  fetchedAt: 0,
};

/**
 * "IHLD Lop ID" -> "ihldLopId"
 * "Jml ODP"     -> "jmlOdp"
 * "NO"          -> "no"
 */
function toCamelCase(header) {
  const words = header.trim().split(/\s+/);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/**
 * Baca baris mentah dari Google Sheets, baris pertama dianggap header,
 * hasilnya array of object dengan key camelCase.
 *
 * Sesuaikan SHEET_RANGE di .env kalau susunan kolom di spreadsheet asli
 * berbeda dari contoh (NO, WOK, Tipe Desain, Nama Proyek, Keterangan Drop,
 * IHLD Lop ID, Jml ODP, Jml Port, Total BOQ).
 */
async function fetchRowsFromSheet() {
  if (USE_SAMPLE_DATA) {
    const content = await fs.readFile(path.resolve(SAMPLE_DATA_PATH), "utf8");
    return JSON.parse(content);
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RANGE,
  });

  const values = res.data.values || [];
  if (values.length === 0) return [];

  const [headerRow, ...dataRows] = values;
  const keys = headerRow.map(toCamelCase);

  return dataRows
    .filter((row) => row.some((cell) => cell && cell.toString().trim() !== ""))
    .map((row) => {
      const obj = {};
      keys.forEach((key, i) => {
        obj[key] = row[i] ?? "";
      });
      return obj;
    });
}


export async function getProjects(forceRefresh = false) {
  const isExpired = Date.now() - cache.fetchedAt > CACHE_TTL_MS;
  if (forceRefresh || isExpired || cache.rows.length === 0) {
    cache.rows = await fetchRowsFromSheet();
    cache.fetchedAt = Date.now();
  }
  return cache.rows;
}

export async function getRowsByIds(ids, idField = "ihldLopId") {
  const projects = await getProjects();
  const idSet = new Set(ids.map(String));
  return projects.filter((p) => idSet.has(String(p[idField])));
}
