/**
 * Kategori deadline tugas, dihitung per permintaan (tidak disimpan).
 *
 * Aturan:
 *   - sisa waktu <= 0          -> "overdue"
 *   - 0 < sisa waktu < 24 jam  -> "mendekati"
 *   - selain itu               -> "normal" (tepat 24 jam masih "normal")
 *   - `status` tugas diabaikan; tugas "selesai" tetap diberi kategori.
 *
 * Deadline disimpan sebagai waktu lokal tanpa zona waktu dan dianggap WIB
 * (+07:00), apa pun zona waktu server.
 */

export const NEAR_MS = 24 * 60 * 60 * 1000;

const WIB_OFFSET = "+07:00";
const NAIVE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const ZONED_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const GROUP_RANK = { mendekati: 0, overdue: 1, normal: 2 };

/**
 * Mengurai string tanggal-waktu. Format tanpa zona dibaca sebagai WIB (+07:00);
 * format yang sudah berakhiran `Z` atau `±hh:mm` dibaca apa adanya.
 *
 * @param {string} value Contoh: "2026-07-02T10:00" atau "2026-07-02T10:00:00".
 * @returns {Date} Invalid Date jika `value` bukan string atau formatnya tidak dikenal.
 */
export function parseWIB(value) {
  if (typeof value !== "string") return new Date(NaN);
  if (ZONED_RE.test(value)) return new Date(value);
  if (NAIVE_RE.test(value)) {
    const withSeconds = value.length === 16 ? `${value}:00` : value;
    return new Date(`${withSeconds}${WIB_OFFSET}`);
  }
  return new Date(NaN);
}

/**
 * Menentukan kategori deadline sebuah tugas pada waktu `now`.
 *
 * @param {{ deadline: string }} task Tugas yang diperiksa.
 * @param {Date} now Waktu acuan (dapat disuntikkan agar mudah diuji).
 * @returns {{ kategori: "mendekati" | "overdue" | "normal", sisa_menit: number | null }}
 *   `sisa_menit` dibulatkan ke arah nol; `null` jika deadline tidak valid.
 */
export function categorizeTask(task, now) {
  const deadlineMs = parseWIB(task?.deadline).getTime();
  if (Number.isNaN(deadlineMs)) return { kategori: "normal", sisa_menit: null };

  const remainingMs = deadlineMs - now.getTime();
  // `|| 0` mengubah -0 (sisa kurang dari semenit setelah deadline) menjadi 0.
  const sisa_menit = Math.trunc(remainingMs / 60000) || 0;
  if (remainingMs <= 0) return { kategori: "overdue", sisa_menit };
  if (remainingMs < NEAR_MS) return { kategori: "mendekati", sisa_menit };
  return { kategori: "normal", sisa_menit };
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// created_at yang tidak dapat diurai dianggap paling lama.
function createdAtMs(task) {
  const ms = parseWIB(task.created_at).getTime();
  return Number.isNaN(ms) ? -Infinity : ms;
}

function compareTasks(a, b) {
  const byGroup = GROUP_RANK[a.kategori] - GROUP_RANK[b.kategori];
  if (byGroup !== 0) return byGroup;

  let withinGroup = 0;
  if (a.kategori === "mendekati") {
    withinGroup = compare(a.sisa_menit, b.sisa_menit); // paling dekat dulu
  } else if (a.kategori === "overdue") {
    withinGroup = compare(b.sisa_menit, a.sisa_menit); // paling baru lewat dulu
  } else {
    withinGroup = compare(createdAtMs(b), createdAtMs(a)); // paling baru dibuat dulu
  }
  return withinGroup !== 0 ? withinGroup : compare(a.id, b.id);
}

/**
 * Menambahkan `mata_kuliah`, `kategori` dan `sisa_menit` ke tiap tugas, lalu
 * mengurutkannya: mendekati, overdue, lalu normal.
 *
 * @param {object[]} tasks Daftar tugas.
 * @param {{ id: number, name: string }[]} courses Daftar mata kuliah.
 * @param {Date} now Waktu acuan.
 * @returns {object[]} Daftar baru; `tasks` tidak diubah.
 */
export function buildTaskList(tasks, courses, now) {
  const courseNames = new Map(courses.map((course) => [course.id, course.name]));
  return tasks
    .map((task) => ({
      ...task,
      mata_kuliah: courseNames.get(task.mata_kuliah_id) ?? null,
      ...categorizeTask(task, now)
    }))
    .sort(compareTasks);
}
