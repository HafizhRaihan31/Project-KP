import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import projectsRouter from "./routes/projects.js";
import generateRouter from "./routes/generate.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/projects", projectsRouter);
app.use("/api/generate", generateRouter);

app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
});
