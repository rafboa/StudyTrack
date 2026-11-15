import React, { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "./ui/Button.jsx";

/**
 * Satu baris mata kuliah. Menghapus mata kuliah juga menghapus semua tugasnya
 * di server, jadi penghapusan meminta konfirmasi di baris yang sama.
 *
 * Fokus: masuk mode konfirmasi memindahkan fokus ke "Batal" (peringatannya
 * dibacakan lewat role="alert"); Batal atau Escape mengembalikan fokus ke
 * tombol "Hapus"; bila penghapusan gagal, fokus juga kembali ke "Hapus".
 *
 * @param {object} props
 * @param {{ id: number, name: string, kode?: string, dosen?: string }} props.course
 * @param {(id: number) => Promise<boolean>} props.onDelete Mengembalikan true bila berhasil.
 */
export default function CourseRow({ course, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef(null);
  const cancelRef = useRef(null);
  // Ke mana fokus harus pergi setelah render berikutnya: "cancel" | "delete" | null.
  const focusNext = useRef(null);
  const warningId = `mk-${course.id}-peringatan`;

  useEffect(() => {
    if (focusNext.current === "cancel") cancelRef.current?.focus();
    if (focusNext.current === "delete") deleteRef.current?.focus();
    focusNext.current = null;
  }, [confirming]);

  function openConfirm() {
    focusNext.current = "cancel";
    setConfirming(true);
  }

  function closeConfirm() {
    focusNext.current = "delete";
    setConfirming(false);
  }

  async function handleConfirm() {
    setDeleting(true);
    const ok = await onDelete(course.id);
    // Bila berhasil, baris ini hilang dan halaman yang memindahkan fokus.
    if (!ok) {
      setDeleting(false);
      closeConfirm();
    }
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {course.name}
          {course.kode && <span className="ml-2 text-sm font-normal text-muted">{course.kode}</span>}
        </p>
        <p className="text-sm text-muted">{course.dosen || "Dosen belum diisi"}</p>
      </div>

      {confirming ? (
        <div
          role="group"
          aria-label={`Konfirmasi hapus ${course.name}`}
          aria-describedby={warningId}
          className="flex flex-col gap-2 sm:items-end"
          onKeyDown={(e) => {
            if (e.key === "Escape" && !deleting) {
              e.stopPropagation();
              closeConfirm();
            }
          }}
        >
          <p id={warningId} role="alert" className="text-sm text-ink">
            Semua tugas di mata kuliah ini ikut terhapus.
          </p>
          <div className="flex gap-2">
            <Button ref={cancelRef} variant="secondary" onClick={closeConfirm}>
              Batal
            </Button>
            <Button variant="danger" icon={Trash2} loading={deleting} loadingText="Menghapus…" onClick={handleConfirm}>
              Hapus mata kuliah
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={deleteRef}
          variant="danger"
          icon={Trash2}
          onClick={openConfirm}
          aria-label={`Hapus ${course.name}`}
          className="self-start sm:self-auto"
        >
          Hapus
        </Button>
      )}
    </li>
  );
}
