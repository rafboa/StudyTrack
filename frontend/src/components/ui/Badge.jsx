import React from "react";
import { cn } from "../../lib/cn.js";

/*
 * Diadaptasi dari Watermelon UI: Badge 18 / Badge 19 (tag status berikon,
 * sudut kecil) dan Badge 15 (pil lembut). Warna hijau/merah/langit bawaannya
 * diganti token status StudyTrack. Ikon hanya penguat: teksnya tetap
 * membawa arti, jadi status tidak bergantung pada warna.
 */

const TONES = {
  mendekati: "bg-mendekati-tint text-mendekati-ink border-mendekati",
  overdue: "bg-overdue text-on-overdue border-overdue",
  selesai: "bg-selesai-tint text-selesai-ink border-selesai-tint",
  neutral: "bg-surface-muted text-muted border-line"
};

/**
 * @param {object} props
 * @param {"mendekati" | "overdue" | "selesai" | "neutral"} [props.tone]
 * @param {React.ComponentType} [props.icon]
 */
export default function Badge({ tone = "neutral", icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-sm font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      {children}
    </span>
  );
}
