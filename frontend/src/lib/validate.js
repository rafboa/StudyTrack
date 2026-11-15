/**
 * Aturan validasi formulir sisi klien. Pesannya menjelaskan cara memperbaiki,
 * bukan menyalahkan pengguna. Server tetap menjadi penentu akhir.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Wajib diisi. */
export function required(message) {
  return (value) => (String(value ?? "").trim() ? "" : message);
}

/** Format email sederhana. */
export function email(value) {
  if (!String(value ?? "").trim()) return "Isi email, mis. nama@kampus.ac.id.";
  return EMAIL_RE.test(value) ? "" : "Gunakan format email seperti nama@kampus.ac.id.";
}

/**
 * Menjalankan aturan untuk setiap field.
 *
 * @param {Record<string, (value: any) => string>} rules
 * @param {Record<string, any>} values
 * @returns {Record<string, string>} Hanya field yang gagal.
 */
export function validateAll(rules, values) {
  const errors = {};
  for (const [name, rule] of Object.entries(rules)) {
    const message = rule(values[name]);
    if (message) errors[name] = message;
  }
  return errors;
}
