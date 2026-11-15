import React from "react";
import { cn } from "../../lib/cn.js";

/**
 * Blok placeholder statis yang berdenyut pelan. Animasi otomatis berhenti bila
 * pengguna memilih `prefers-reduced-motion` (lihat index.css).
 */
export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-sm bg-surface-muted", className)} />;
}
