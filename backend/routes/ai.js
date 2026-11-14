import { Router } from "express";
import { readDB } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { buildTaskList } from "../lib/deadline.js";
import { selectAdviceTasks, getAdvice } from "../services/advice.js";

export const RATE_LIMIT_MS = 10_000;

/**
 * Membuat router AI. Pembatas laju disimpan di memori per router (per aplikasi),
 * dengan kunci id pengguna.
 *
 * @param {{ name: string, call: (prompt: string) => Promise<string> }[]} providers
 * @returns {import("express").Router}
 */
export function createAiRouter(providers) {
  const router = Router();
  const lastCall = new Map();

  router.use(requireAuth);

  /**
   * POST /api/ai/prioritas
   * Saran urutan pengerjaan tugas yang mendekati deadline atau terlambat.
   * Server memilih tugas milik pengguna sendiri; klien tidak mengirim apa pun.
   * Satu panggilan per pengguna tiap 10 detik.
   *
   * Response : 200 { saran, sumber, jumlah_tugas } | 429 terlalu sering
   *            | 500 kegagalan internal (batas laju dilepas)
   */
  router.post("/prioritas", async (req, res) => {
    const now = req.app.locals.now();
    const previous = lastCall.get(req.user.id);
    if (previous !== undefined && now.getTime() - previous < RATE_LIMIT_MS) {
      return res
        .status(429)
        .json({ error: "Terlalu sering meminta saran. Coba lagi dalam beberapa detik." });
    }
    lastCall.set(req.user.id, now.getTime());

    // Express 4 tidak menangkap penolakan async, jadi kegagalan internal
    // (mis. db.json rusak) ditangani di sini. Isi error tidak dikirim ke klien.
    try {
      const db = readDB();
      const userTasks = db.tasks.filter((t) => t.user_id === req.user.id);
      const selected = selectAdviceTasks(buildTaskList(userTasks, db.courses, now));
      const { saran, sumber } = await getAdvice(selected, providers);

      res.json({ saran, sumber, jumlah_tugas: selected.length });
    } catch {
      // Kegagalan sisi server tidak boleh mengunci pengguna selama 10 detik.
      lastCall.delete(req.user.id);
      res.status(500).json({ error: "Terjadi kesalahan pada server. Coba lagi nanti." });
    }
  });

  return router;
}
