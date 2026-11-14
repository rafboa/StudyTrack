import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { readDB } from "../db.js";

/**
 * Middleware autentikasi. Memverifikasi JWT dari header
 * `Authorization: Bearer <token>`.
 *
 * Token yang valid harus milik pengguna yang masih ada di database dengan email
 * yang sama (db.json bisa kembali ke data seed saat server restart, sedangkan
 * JWT_SECRET tetap). Jika ya, data pengguna dari database disimpan di
 * `req.user` ({ id, nama, email }) dan request diteruskan. Jika tidak, server
 * membalas 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token tidak ditemukan. Silakan login terlebih dahulu." });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa." });
  }

  // Kegagalan membaca database (mis. db.json rusak) adalah kesalahan server,
  // bukan token tidak valid. Isi error tidak dikirim ke klien.
  let user;
  try {
    user = readDB().users.find((u) => u.id === payload.sub);
  } catch {
    return res.status(500).json({ error: "Terjadi kesalahan pada server. Coba lagi nanti." });
  }
  if (!user || user.email !== payload.email) {
    return res.status(401).json({ error: "Akun untuk token ini tidak ditemukan. Silakan login ulang." });
  }

  req.user = { id: user.id, nama: user.nama, email: user.email };
  next();
}
