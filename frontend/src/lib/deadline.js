/**
 * Utilitas deadline di sisi tampilan. Backend menyimpan deadline tanpa zona
 * waktu dan membacanya sebagai WIB (+07:00); fungsi di sini mengikuti aturan
 * yang sama supaya jam yang tampil selalu jam WIB, apa pun zona waktu browser.
 */

/** Pesan yang sama persis dengan pesan 400 dari server. */
export const INVALID_DEADLINE_MESSAGE =
  "Format deadline tidak valid. Gunakan tanggal dan jam yang benar, mis. 2026-07-03T23:59.";

const NAIVE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const ZONED_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Mengurai deadline seperti `parseWIB` di backend.
 *
 * @param {string} value
 * @returns {Date} Invalid Date bila format tidak dikenal.
 */
export function parseWIB(value) {
  if (typeof value !== "string") return new Date(NaN);
  if (ZONED_RE.test(value)) return new Date(value);
  if (NAIVE_RE.test(value)) {
    const withSeconds = value.length === 16 ? `${value}:00` : value;
    return new Date(`${withSeconds}+07:00`);
  }
  return new Date(NaN);
}

/** True bila server akan menerima nilai deadline ini. */
export function isValidDeadline(value) {
  return !Number.isNaN(parseWIB(value).getTime());
}

const WIB_FORMAT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

/**
 * Memformat deadline sebagai waktu WIB, contoh: "03 Jul 2026, 23.59".
 * Label "WIB" ditambahkan oleh pemanggil.
 *
 * @param {string} deadline
 * @returns {string} String asli bila tidak dapat diurai.
 */
export function formatDeadlineWIB(deadline) {
  const date = parseWIB(deadline);
  if (Number.isNaN(date.getTime())) return deadline;
  return WIB_FORMAT.format(date);
}
