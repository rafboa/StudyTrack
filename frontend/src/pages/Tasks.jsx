import React, { useState } from "react";
import { Plus } from "lucide-react";
import api, { isSessionExpired } from "../api.js";
import AdvicePanel from "../components/AdvicePanel.jsx";
import AppShell from "../components/AppShell.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import Button from "../components/ui/Button.jsx";
import { useTaskData } from "../lib/useTaskData.js";

/** Memindahkan fokus ke field pertama form tambah tugas. */
function focusTaskForm() {
  const form = document.getElementById("tambah-tugas");
  form?.scrollIntoView({ block: "start" });
  form?.querySelector("select, input")?.focus({ preventScroll: true });
}

/**
 * Halaman Daftar Tugas: daftar seluruh tugas pengguna lintas mata kuliah,
 * sesuai urutan yang dikirim backend, ditambah form tambah tugas dan panel saran.
 */
export default function Tasks() {
  const { tasks, courses, status, reload, retry, mounted } = useTaskData();
  const [actionError, setActionError] = useState("");

  async function act(request, fallback) {
    setActionError("");
    try {
      await request();
    } catch (err) {
      if (isSessionExpired(err) || !mounted.current) return;
      setActionError(err.response?.data?.error || fallback);
      return;
    }
    try {
      await reload();
    } catch (err) {
      if (isSessionExpired(err) || err.stale || !mounted.current) return;
      setActionError("Perubahan sudah tersimpan, tetapi daftar belum diperbarui. Daftar akan diperbarui otomatis dalam 1 menit.");
    }
  }

  function handleToggleStatus(task) {
    const newStatus = task.status === "selesai" ? "belum" : "selesai";
    return act(
      () => api.put(`/tasks/${task.id}`, { status: newStatus }),
      "Status tugas belum tersimpan. Coba lagi."
    );
  }

  function handleDelete(id) {
    return act(() => api.delete(`/tasks/${id}`), "Tugas belum terhapus. Coba lagi.");
  }

  return (
    <AppShell
      title="Daftar Tugas"
      description="Tugas yang deadline-nya kurang dari 24 jam tampil paling atas."
      actions={
        <Button icon={Plus} onClick={focusTaskForm} className="lg:hidden">
          Tambah tugas
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <TaskList
          status={status}
          tasks={tasks}
          hasCourses={courses.length > 0}
          actionError={actionError}
          onRetry={retry}
          onAddTask={focusTaskForm}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
        <aside aria-label="Tambah tugas dan saran" className="flex flex-col gap-6">
          <TaskForm courses={courses} onCreated={reload} />
          <AdvicePanel />
        </aside>
      </div>
    </AppShell>
  );
}
