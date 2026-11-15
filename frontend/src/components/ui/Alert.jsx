import React from "react";
import { CircleAlert, Info } from "lucide-react";
import { cn } from "../../lib/cn.js";

/*
 * Diadaptasi dari Watermelon UI: Alert 15 (galat dengan garis dan latar merah
 * tipis) dan Alert 1 (info satu baris berikon). Dipakai untuk galat formulir,
 * galat memuat data (dengan tombol Coba lagi) dan pesan sesi berakhir.
 */

const TONES = {
  error: { box: "border-danger bg-danger-soft text-ink", icon: "text-danger", Icon: CircleAlert },
  info: { box: "border-line-strong bg-surface-muted text-ink", icon: "text-muted", Icon: Info }
};

/**
 * @param {object} props
 * @param {"error" | "info"} [props.tone]
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.action] Tombol pemulihan, mis. "Coba lagi".
 * @param {string} [props.role] Default: "alert" untuk error, "status" untuk info.
 */
export default function Alert({ tone = "error", title, action, role, className, children }) {
  const t = TONES[tone];
  return (
    <div
      role={role || (tone === "error" ? "alert" : "status")}
      className={cn("flex items-start gap-3 rounded-md border px-4 py-3 text-sm", t.box, className)}
    >
      <t.Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
