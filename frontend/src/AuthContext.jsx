import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { TOKEN_KEY, isSessionExpired, setUnauthorizedHandler } from "./api.js";

const AuthContext = createContext(null);

/** Pesan yang tampil di halaman login setelah sesi berakhir. */
export const SESSION_EXPIRED_MESSAGE = "Sesi Anda sudah berakhir. Silakan login lagi.";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Menyediakan status login ke seluruh aplikasi.
 *
 * Saat pertama dimuat, token yang tersimpan (jika ada) diverifikasi ke
 * `/auth/me`. Selama proses itu `loading` bernilai true. Bila server tidak
 * dapat dihubungi, sesi tidak dihapus; `connectionError` bernilai true dan
 * `retry()` mencoba lagi.
 *
 * Bila request terautentikasi mana pun dibalas 401, token dihapus dan pengguna
 * diarahkan ke halaman login dengan pesan singkat (lewat state router, bukan URL).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Beberapa request bisa gagal bersamaan; cukup tangani bila masih ada sesi.
      if (!localStorage.getItem(TOKEN_KEY) && !userRef.current) return;
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      if (!PUBLIC_PATHS.includes(pathRef.current)) {
        navigate("/login", { replace: true, state: { message: SESSION_EXPIRED_MESSAGE } });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  /**
   * Memverifikasi token tersimpan ke `/auth/me`.
   * - 401: interceptor sudah menghapus token dan mengarahkan ke login.
   * - galat lain (server mati, 502 saat cold start, jaringan): token TIDAK dihapus;
   *   `connectionError` diisi agar halaman terlindungi menampilkan tombol Coba lagi.
   */
  const verifySession = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setConnectionError(false);
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        if (!isSessionExpired(err)) setConnectionError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  /** Menyimpan token dan data pengguna setelah login atau registrasi berhasil. */
  function login(token, userData) {
    localStorage.setItem(TOKEN_KEY, token);
    setConnectionError(false);
    setUser(userData);
  }

  /** Menghapus token dan data pengguna. */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setConnectionError(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, connectionError, retry: verifySession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook untuk mengakses `{ user, loading, connectionError, retry, login, logout }`. */
export function useAuth() {
  return useContext(AuthContext);
}
