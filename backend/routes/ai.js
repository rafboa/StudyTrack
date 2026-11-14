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

    const db = readDB();
    const userTasks = db.tasks.filter((t) => t.user_id === req.user.id);
    const selected = selectAdviceTasks(buildTaskList(userTasks, db.courses, now));
    const { saran, sumber } = await getAdvice(selected, providers);

    res.json({ saran, sumber, jumlah_tugas: selected.length });
  });

  return router;
}
