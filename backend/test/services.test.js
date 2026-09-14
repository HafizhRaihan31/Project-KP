import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.USE_SAMPLE_DATA = "true";

const { getProjects, getRowsByIds } = await import("../src/services/sheetsService.js");
const { buildTemplateData, renderDocx } = await import("../src/services/docService.js");

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

  const output = renderDocx("templates/ba-drop-template.docx", data);
  assert.ok(Buffer.isBuffer(output));
  assert.ok(output.length > 0);

  const tempFile = path.join(os.tmpdir(), `doc-generator-${Date.now()}.docx`);
  fs.writeFileSync(tempFile, output);
  assert.ok(fs.statSync(tempFile).size > 0);
  fs.unlinkSync(tempFile);
});
