import { useCallback, useEffect, useRef, useState } from "react";
import api, { isSessionExpired } from "../api.js";

const REFRESH_MS = 60000;

/**
 * Memuat tugas dan mata kuliah untuk halaman Daftar Tugas.
 *
 * - `status`: "loading" (muat pertama), "error" (muat pertama gagal) atau "ready".
 * - `reload()`: memuat ulang; galatnya diteruskan ke pemanggil.
 * - `retry()`: kembali ke status loading lalu memuat ulang (untuk tombol Coba lagi).
 * - Muat ulang otomatis tiap menit dan saat tab kembali aktif agar kategori
 *   mengikuti waktu. Galat pada refresh latar belakang diabaikan (data lama tetap tampil).
 *
 * Urutan dan kategori tugas dipakai apa adanya dari server.
 */
export function useTaskData() {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Nomor urut request: hanya hasil request terbaru yang boleh ditampilkan, agar
  // refresh latar belakang yang lambat tidak menimpa hasil setelah tambah/tandai/hapus.
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current;
    let tasksRes, coursesRes;
    try {
      [tasksRes, coursesRes] = await Promise.all([api.get("/tasks"), api.get("/courses")]);
    } catch (err) {
      if (requestId !== latestRequest.current) err.stale = true;
      throw err;
    }
    if (!mounted.current || requestId !== latestRequest.current) return;
    setTasks(tasksRes.data.tasks);
    setCourses(coursesRes.data.courses);
    setStatus("ready");
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    reload().catch((err) => {
      if (!mounted.current || isSessionExpired(err) || err.stale) return;
      setStatus("error");
    });
  }, [reload]);

  useEffect(() => {
    retry();
  }, [retry]);

  useEffect(() => {
    const refresh = () => {
      reload().catch(() => {});
    };
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [reload]);

  return { tasks, courses, status, reload, retry, mounted };
}
