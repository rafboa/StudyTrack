/**
 * Memformat sisa waktu menuju deadline (atau keterlambatan) menjadi teks singkat.
 *
 * - mendekati: "Sisa 1 j 0 m", "Sisa 59 m", "Sisa kurang dari 1 m"
 * - overdue:   "Terlambat 1 m", "Terlambat 1 j 30 m", "Terlambat 2 hr 2 j"
 * - normal atau sisaMenit null: "" (tidak ada penanda)
 *
 * @param {number | null} sisaMenit Menit tersisa dari server; nol atau negatif saat lewat deadline.
 * @param {"mendekati" | "overdue" | "normal"} kategori Kategori dari server.
 * @returns {string}
 */
export function formatSisa(sisaMenit, kategori) {
  if (sisaMenit === null || sisaMenit === undefined || Number.isNaN(sisaMenit)) return "";
  if (kategori !== "mendekati" && kategori !== "overdue") return "";

  const awalan = kategori === "mendekati" ? "Sisa" : "Terlambat";
  // Math.abs juga menormalkan -0 menjadi 0.
  const total = Math.trunc(Math.abs(sisaMenit));
  if (total < 1) return `${awalan} kurang dari 1 m`;

  const hari = Math.floor(total / 1440);
  const jam = Math.floor((total % 1440) / 60);
  const menit = total % 60;

  if (kategori === "overdue" && hari > 0) return `${awalan} ${hari} hr ${jam} j`;
  if (jam > 0) return `${awalan} ${jam} j ${menit} m`;
  return `${awalan} ${menit} m`;
}
