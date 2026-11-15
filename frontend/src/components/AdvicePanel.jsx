import React, { useEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import api, { isSessionExpired } from "../api.js";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import { Card, CardContent, CardHeader } from "./ui/Card.jsx";
import Skeleton from "./ui/Skeleton.jsx";

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
      if (!mounted.current || isSessionExpired(err)) return;
      // Saran lama disembunyikan agar tidak terbaca sebagai hasil permintaan yang gagal.
      setSaran("");
      setSumber("");
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
    <Card aria-labelledby="saran-judul" aria-busy={loading}>
      <CardHeader
        id="saran-judul"
        title="Saran urutan belajar"
        description="Urutan pengerjaan berdasarkan deadline tugas yang belum selesai."
      />
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="secondary"
          icon={Lightbulb}
          onClick={handleClick}
          loading={loading}
          loadingText="Memproses…"
          className="self-start"
        >
          Minta saran prioritas
        </Button>
        {error && <Alert>{error}</Alert>}
        <div aria-live="polite" className="flex flex-col gap-2">
          {loading && (
            <div aria-hidden="true" className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {!loading && sumber && (
            <>
              <p className="max-w-prose text-sm whitespace-pre-wrap text-ink">{saran}</p>
              <p className="text-xs text-muted">{SUMBER_LABEL[sumber] || SUMBER_LABEL.rule}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
