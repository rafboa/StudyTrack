/**
 * Menggabungkan nama class, melewati nilai kosong (false, null, undefined, "").
 *
 * @param {...(string | false | null | undefined)} parts
 * @returns {string}
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
