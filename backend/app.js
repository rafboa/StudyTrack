/**
 * Pembuat aplikasi Express backend StudyTrack.
 *
 * Menyiapkan Express dan mendaftarkan route tiap modul (auth, courses, tasks).
 * Dipisahkan dari `server.js` supaya aplikasi bisa dibuat ulang dengan jam
 * (`now`) yang bisa diatur, sehingga mudah diuji tanpa membuka port tetap.
 */
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import taskRoutes from "./routes/tasks.js";
import { resetDB } from "./db.js";

/**
 * Membuat aplikasi Express.
 *
 * @param {{ now?: () => Date, providers?: object[] }} [opts]
 *   now       : sumber waktu sekarang (bawaan `() => new Date()`), diakses route
 *               lewat `req.app.locals.now`.
 *   providers : daftar provider yang dipakai fitur lain, tersedia lewat
 *               `req.app.locals.providers` (tidak diisi secara bawaan).
 * @returns {import("express").Express} Aplikasi Express yang belum di-listen.
 */
export function createApp({ now = () => new Date(), providers } = {}) {
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

  // Fallback untuk endpoint yang tidak terdaftar
  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan." });
  });

  return app;
}
