import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import projectsRouter from "./routes/projects.js";
import generateRouter from "./routes/generate.js";
import { authRouter, requireAuth, validateAuthConfig } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

validateAuthConfig();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/generate", requireAuth, generateRouter);

app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
});
