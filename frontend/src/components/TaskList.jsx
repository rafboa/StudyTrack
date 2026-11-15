import React from "react";
import { Link } from "react-router-dom";
import { ListTodo, Plus, RotateCw } from "lucide-react";
import TaskCard from "./TaskCard.jsx";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import Skeleton from "./ui/Skeleton.jsx";

/** Ringkasan jumlah per kategori, dihitung dari kategori server (tanpa mengurutkan ulang). */
function summary(tasks) {
  const mendekati = tasks.filter((t) => t.kategori === "mendekati").length;
  const overdue = tasks.filter((t) => t.kategori === "overdue").length;
  const parts = [`${tasks.length} tugas`];
  if (mendekati) parts.push(`${mendekati} mendekati deadline`);
  if (overdue) parts.push(`${overdue} terlambat`);
  return parts.join(" · ");
}

function TaskSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Memuat tugas" className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Bagian daftar tugas dengan kondisi memuat, galat, kosong dan berisi.
 * Tugas ditampilkan persis sesuai urutan dari server.
 *
 * @param {object} props
 * @param {"loading" | "error" | "ready"} props.status
 * @param {object[]} props.tasks
 * @param {boolean} props.hasCourses Tanpa mata kuliah, aksi kosongnya mengarah ke halaman Mata Kuliah.
 * @param {string} props.actionError Galat dari tandai/hapus.
 * @param {() => void} props.onRetry
 * @param {() => void} props.onAddTask Memfokuskan form tambah tugas.
 */
export default function TaskList({
  status,
  tasks,
  hasCourses,
  actionError,
  onRetry,
  onAddTask,
  onToggleStatus,
  onDelete
}) {
  return (
    <section aria-labelledby="daftar-tugas" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="daftar-tugas" className="text-h2">
          Tugas
        </h2>
        {status === "ready" && tasks.length > 0 && <p className="text-sm text-muted">{summary(tasks)}</p>}
      </div>

      {actionError && <Alert>{actionError}</Alert>}

      {status === "loading" && <TaskSkeleton />}

      {status === "error" && (
        <Alert
          title="Daftar tugas tidak dapat dimuat."
          action={
            <Button variant="secondary" icon={RotateCw} onClick={onRetry}>
              Coba lagi
            </Button>
          }
        >
          Tidak dapat memuat data. Coba lagi sebentar lagi.
        </Alert>
      )}

      {status === "ready" && tasks.length === 0 && (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            icon={ListTodo}
            title="Belum ada tugas"
            description={
              hasCourses
                ? "Tambahkan tugas pertama Anda. Tugas yang deadline-nya kurang dari 24 jam akan muncul paling atas."
                : "Tugas dikelompokkan per mata kuliah. Tambahkan mata kuliah dulu, lalu catat tugas pertama Anda."
            }
            action={
              hasCourses ? (
                <Button icon={Plus} onClick={onAddTask}>
                  Tambah tugas
                </Button>
              ) : (
                <Link
                  to="/courses"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-on-accent transition-colors duration-150 hover:bg-accent-hover"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Tambah mata kuliah
                </Link>
              )
            }
          />
        </div>
      )}

      {status === "ready" && tasks.length > 0 && (
        <ul className="flex flex-col gap-4">
          {tasks.map((t) => (
            <li key={t.id} className="@container">
              <TaskCard task={t} onToggleStatus={onToggleStatus} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
