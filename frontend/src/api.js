import axios from "axios";

/** Kunci localStorage tempat token login disimpan. */
export const TOKEN_KEY = "studytrack_token";

/**
 * Instance axios untuk seluruh pemanggilan API backend.
 * Pada mode development, request `/api/*` di-proxy ke backend oleh Vite
 * (lihat `vite.config.js`).
 */
const api = axios.create({
  baseURL: "/api"
});

// Menyisipkan token login ke setiap request jika tersedia.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoint yang memang membalas 401 untuk kredensial salah; bukan tanda sesi habis.
const AUTH_FORM_URLS = ["/auth/login", "/auth/register"];

let onUnauthorized = null;

/**
 * Mendaftarkan fungsi yang dipanggil saat request terautentikasi dibalas 401
 * (token kedaluwarsa, atau akunnya sudah tidak ada). Dipakai oleh AuthContext.
 *
 * @param {(() => void) | null} handler
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/** True bila error ini adalah 401 dari sesi yang berakhir (sudah ditangani global). */
export function isSessionExpired(err) {
  return Boolean(err?.sessionExpired);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || "";
    if (status === 401 && !AUTH_FORM_URLS.includes(url)) {
      err.sessionExpired = true;
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
