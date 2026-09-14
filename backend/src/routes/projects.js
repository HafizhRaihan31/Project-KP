import { Router } from "express";
import { getProjects } from "../services/sheetsService.js";

const router = Router();

function filterProjects(projects, search = "") {
  return search
    ? projects.filter((p) =>
        Object.values(p).some((val) =>
          val.toString().toLowerCase().includes(search.toLowerCase())
        )
      )
    : projects;
}

// GET /api/projects?search=kendal
router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const projects = await getProjects();
    const filtered = filterProjects(projects, search);

    res.json({ data: filtered, total: filtered.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data proyek", detail: err.message });
  }
});

// POST /api/projects/refresh -> paksa ambil ulang dari Google Sheets
router.post("/refresh", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const projects = await getProjects(true);
    const filtered = filterProjects(projects, search);

    res.json({ data: filtered, total: filtered.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal refresh data", detail: err.message });
  }
});

export default router;
