import { Router } from "express";
import dotenv from "dotenv";
import { getRowsByIds } from "../services/sheetsService.js";
import { buildTemplateData, renderDocx, convertDocxToPdf } from "../services/docService.js";

dotenv.config();

const router = Router();
const TEMPLATE_PATH = process.env.TEMPLATE_PATH || "templates/ba-drop-template.docx";

function sanitizeFilename(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 120);
}

// POST /api/generate  body: { ids, format, filename?, reportDetails? }
router.post("/", async (req, res) => {
  try {
    const { ids, format = "docx", filename = "", reportDetails = {} } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids wajib diisi (array, minimal 1)" });
    }
    if (!["docx", "pdf"].includes(format)) {
      return res.status(400).json({ error: "format harus 'docx' atau 'pdf'" });
    }

    const rows = await getRowsByIds(ids);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tidak ada proyek yang cocok dengan ids tersebut" });
    }

    const templateData = buildTemplateData(rows, reportDetails);
    const docxBuffer = renderDocx(TEMPLATE_PATH, templateData);

    const fileDate = new Date().toISOString().slice(0, 10);
    const baseFilename = sanitizeFilename(filename) || `BA_Drop_${fileDate}`;

    if (format === "docx") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.docx"`);
      return res.send(docxBuffer);
    }

    const pdfBuffer = await convertDocxToPdf(docxBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal generate dokumen", detail: err.message });
  }
});

export default router;
