import React, { useState } from "react";
import { AlarmClock, CalendarClock, Check, CircleCheck, Circle, OctagonAlert, RotateCcw, Trash2 } from "lucide-react";
import { formatSisa } from "../lib/formatSisa.js";
import { formatDeadlineWIB } from "../lib/deadline.js";
import { cn } from "../lib/cn.js";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";

/** Penanda per kategori. Kategori `normal` tidak diberi penanda. */
const PENANDA = {
  mendekati: { label: "Mendekati Deadline", icon: AlarmClock, card: "border-mendekati bg-mendekati-soft", sisa: "text-mendekati-ink" },
  overdue: { label: "Terlambat", icon: OctagonAlert, card: "border-overdue bg-overdue-soft", sisa: "text-overdue-ink" }
};

/**
 * Card satu tugas pada halaman Daftar Tugas. Kategori dan sisa waktu datang
 * dari server; tugas `selesai` tetap diberi penanda kategori (keputusan spek).
 *
 * @param {object} props
 * @param {object} props.task Data tugas dari API (termasuk `mata_kuliah`, `kategori`, `sisa_menit`).
 * @param {(task: object) => Promise<void>} props.onToggleStatus
 * @param {(id: number) => Promise<void>} props.onDelete
 */
export default function TaskCard({ task, onToggleStatus, onDelete }) {
  const [pending, setPending] = useState(""); // "" | "toggle" | "delete"
  const penanda = PENANDA[task.kategori];
  const sisa = formatSisa(task.sisa_menit, task.kategori);
  const selesai = task.status === "selesai";
  const titleId = `task-${task.id}-judul`;

  async function run(kind, action) {
    setPending(kind);
    try {
      await action();
    } finally {
      setPending("");
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        // Tata letak mengikuti lebar kolom (container query), bukan lebar layar.
        "flex flex-col gap-4 rounded-lg border p-4 sm:p-6 @2xl:flex-row @2xl:items-start @2xl:justify-between",
        penanda ? penanda.card : "border-line bg-surface",
        task.kategori === "overdue" && "border-2"
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {penanda && (
            <Badge tone={task.kategori} icon={penanda.icon}>
              {penanda.label}
            </Badge>
          )}
          <Badge tone={selesai ? "selesai" : "neutral"} icon={selesai ? CircleCheck : Circle}>
            {selesai ? "Selesai" : "Belum"}
          </Badge>
        </div>

        <h3 id={titleId} className="font-sans text-base font-semibold break-words">
          {task.judul}
        </h3>
        <p className="text-sm text-muted">{task.mata_kuliah || "Tanpa mata kuliah"}</p>

        <p className="flex items-center gap-2 text-sm text-ink">
          <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-subtle" />
          <span>
            Deadline: <time dateTime={task.deadline}>{formatDeadlineWIB(task.deadline)}</time>{" "}
            <abbr title="Waktu Indonesia Barat (UTC+7)" className="font-medium no-underline">
              WIB
            </abbr>
          </span>
        </p>
        {sisa && <p className={cn("text-sm font-semibold", penanda?.sisa)}>{sisa}</p>}
        {task.deskripsi && <p className="max-w-prose text-sm break-words text-muted">{task.deskripsi}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 @2xl:justify-end">
        <Button
          variant="secondary"
          icon={selesai ? RotateCcw : Check}
          loading={pending === "toggle"}
          loadingText="Menyimpan…"
          onClick={() => run("toggle", () => onToggleStatus(task))}
        >
          {selesai ? "Tandai Belum" : "Tandai Selesai"}
        </Button>
        <Button
          variant="danger"
          icon={Trash2}
          loading={pending === "delete"}
          loadingText="Menghapus…"
          aria-label={`Hapus tugas ${task.judul}`}
          onClick={() => run("delete", () => onDelete(task.id))}
        >
          Hapus
        </Button>
      </div>
    </article>
  );
}
