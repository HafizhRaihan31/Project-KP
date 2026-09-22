import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.USE_SAMPLE_DATA = "true";
process.env.APP_PASSWORD = "test-password";
process.env.SESSION_SECRET = "test-session-secret-minimal-32-karakter";

const { getProjects, getRowsByIds } = await import("../src/services/sheetsService.js");
const { buildTemplateData, formatReportDate, renderDocx } = await import("../src/services/docService.js");
const { createSessionToken, requireAuth, validateAuthConfig, verifySessionToken } = await import("../src/auth.js");

test("membaca dan mencari data contoh lokal", async () => {
  const projects = await getProjects(true);
  assert.equal(projects.length, 3);

  const selected = await getRowsByIds(["12325183"]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].wok, "SMG-1");
});

test("menghitung total dan menghasilkan DOCX", async () => {
  const projects = await getProjects(true);
  const data = buildTemplateData(projects.slice(0, 2));

  assert.equal(data.jumlahLop, 2);
  assert.equal(data.totalOdp, "7");
  assert.equal(data.totalPort, "56");
  assert.equal(data.totalBoq, "48.137.267");
  assert.deepEqual(data.evidenceRows, [{
    leftCaption: "PT3BR-25-WLR-FA-KENDAL_22024_H2_2025 (Warga tidak mengizinkan penambahan tiang)",
    rightCaption: "PT3BR-25-SMC-FC-SMG2_SMC_SEKARANGNPATI (Hasil review DBAD = DROP, OVER CPP)",
  }]);

  const output = renderDocx("templates/ba-drop-template.docx", data);
  assert.ok(Buffer.isBuffer(output));
  assert.ok(output.length > 0);

  const tempFile = path.join(os.tmpdir(), `doc-generator-${Date.now()}.docx`);
  fs.writeFileSync(tempFile, output);
  assert.ok(fs.statSync(tempFile).size > 0);
  fs.unlinkSync(tempFile);
});

test("mengisi detail berita acara dan mengeja tanggal", async () => {
  const projects = await getProjects(true);
  const data = buildTemplateData(projects.slice(0, 1), {
    projectTitle: "JPP 2026 TIF Batch 1 Semarang",
    contractNumber: "PKS-001",
    spNumber: "SP-002",
    executor: "PT. TELKOM AKSES",
    district: "Semarang",
    reportDate: "2026-06-03",
  });

  assert.equal(data.judulProyek, "JPP 2026 TIF Batch 1 Semarang");
  assert.equal(data.nomorKontrak, "PKS-001");
  assert.equal(data.nomorSp, "SP-002");
  assert.equal(data.tanggalBeritaAcara, "Rabu Tanggal Tiga Bulan Juni Tahun Dua Ribu Dua Puluh Enam");
  assert.equal(formatReportDate("2026-06-03"), data.tanggalBeritaAcara);
  assert.equal(data.tanggalDokumen, "Semarang, 3 Juni 2026");
});

test("session berlaku selama lima jam dan menolak token kedaluwarsa", () => {
  const now = Date.parse("2026-09-17T00:00:00Z");
  const token = createSessionToken(now);
  assert.equal(verifySessionToken(token, now + (5 * 60 * 60 * 1000) - 1), true);
  assert.equal(verifySessionToken(token, now + (5 * 60 * 60 * 1000)), false);
  assert.equal(verifySessionToken(`${token}rusak`, now), false);
});

test("autentikasi dapat dinonaktifkan sementara melalui environment", () => {
  const previousValue = process.env.AUTH_DISABLED;
  process.env.AUTH_DISABLED = "true";

  try {
    let allowed = false;
    validateAuthConfig();
    requireAuth({ headers: {} }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
  } finally {
    if (previousValue === undefined) delete process.env.AUTH_DISABLED;
    else process.env.AUTH_DISABLED = previousValue;
  }
});
