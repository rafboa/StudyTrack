import React, { useEffect, useRef, useState } from "react";
import api from "../api.js";

/** Keterangan sumber saran. `rule` dan `none` sama-sama tanpa AI. */
const SUMBER_LABEL = {
  gemini: "Disusun oleh Gemini",
  "fallback-llm": "Disusun oleh model open-source",
  rule: "Saran otomatis (tanpa AI)",
  none: "Saran otomatis (tanpa AI)"
};

/**
 * Panel saran urutan belajar: meminta saran prioritas dari backend dan
 * menampilkannya sebagai teks biasa (tidak pernah sebagai HTML).
 */
export default function AdvicePanel() {
  const [loading, setLoading] = useState(false);
  const [saran, setSaran] = useState("");
  const [sumber, setSumber] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/ai/prioritas");
      if (!mounted.current) return;
      setSaran(res.data.saran);
      setSumber(res.data.sumber);
    } catch (err) {
      if (!mounted.current) return;
      setError(
        err.response?.status === 429
          ? "Tunggu beberapa detik sebelum meminta saran lagi."
          : "Gagal memuat saran. Coba lagi nanti."
      );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div className="card advice-panel">
      <h2>Saran Urutan Belajar</h2>
      <button type="button" className="btn" onClick={handleClick} disabled={loading}>
        {loading ? "Memproses…" : "Minta Saran Prioritas"}
      </button>
      {error && <p className="error">{error}</p>}
      {saran && (
        <>
          <p className="advice-text">{saran}</p>
          <p className="meta">{SUMBER_LABEL[sumber] || SUMBER_LABEL.rule}</p>
        </>
      )}
    </div>
  );
}
