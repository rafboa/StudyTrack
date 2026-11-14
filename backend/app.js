/**
 * Pembuat aplikasi Express backend StudyTrack.
 *
 * Menyiapkan Express dan mendaftarkan route tiap modul (auth, courses, tasks).
 * Dipisahkan dari `server.js` supaya aplikasi bisa dibuat ulang dengan jam
 * (`now`) yang bisa diatur, sehingga mudah diuji tanpa membuka port tetap.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import taskRoutes from "./routes/tasks.js";
import { createAiRouter } from "./routes/ai.js";
import { buildProviders } from "./services/llm.js";
import { resetDB } from "./db.js";

// Hasil build frontend (`npm --prefix frontend run build`), relatif terhadap file ini.
const DEFAULT_DIST_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "frontend",
  "dist"
);

/**
 * Membuat aplikasi Express.
 *
 * @param {{ now?: () => Date, providers?: object[], distDir?: string }} [opts]
 *   now       : sumber waktu sekarang (bawaan `() => new Date()`), diakses route
 *               lewat `req.app.locals.now`.
 *   providers : daftar provider LLM untuk /api/ai (bawaan `buildProviders()`,
 *               dibaca dari environment); tersedia juga di `req.app.locals.providers`.
 *   distDir   : folder hasil build frontend (bawaan `frontend/dist`). Jika berisi
 *               `index.html`, folder ini disajikan sebagai file statis.
 * @returns {import("express").Express} Aplikasi Express yang belum di-listen.
 */
export function createApp({ now = () => new Date(), providers, distDir = DEFAULT_DIST_DIR } = {}) {
  const app = express();
  app.locals.now = now;
  app.locals.providers = providers;

  app.use(cors());
  app.use(express.json());

  // GET /api/health - cek apakah server sedang berjalan
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "StudyTrack backend is running." });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/tasks", taskRoutes);
  // Provider dibentuk sekali per aplikasi, bukan per request.
  app.use("/api/ai", createAiRouter(app.locals.providers ?? buildProviders()));

  /*
   * POST /api/dev/reset - mengembalikan data ke kondisi seed awal.
   *
   * Endpoint ini tidak memerlukan login, jadi hanya didaftarkan di luar mode
   * production supaya data tidak bisa direset oleh siapa pun setelah di-deploy.
   * NODE_ENV dibaca saat aplikasi dibuat, bukan saat modul dimuat.
   */
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/dev/reset", (req, res) => {
      resetDB();
      res.json({ success: true, message: "Database direset ke data seed awal." });
    });
  }

  /*
   * Sajikan frontend hasil build bila ada (satu layanan untuk API dan UI).
   * Keberadaan index.html dicek sekali saat aplikasi dibuat. GET non-/api lain
   * dijawab index.html agar rute sisi klien (mis. /tasks) tetap jalan saat di-refresh.
   */
  const indexFile = path.join(distDir, "index.html");
  if (fs.existsSync(indexFile)) {
    app.use(express.static(distDir));
    app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
      res.sendFile(indexFile);
    });
  }

  // Fallback untuk endpoint yang tidak terdaftar
  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan." });
  });

  return app;
}
