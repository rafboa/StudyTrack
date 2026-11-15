import React, { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Plus, RotateCw } from "lucide-react";
import api, { isSessionExpired } from "../api.js";
import AppShell from "../components/AppShell.jsx";
import CourseRow from "../components/CourseRow.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { TextField } from "../components/ui/Field.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { required } from "../lib/validate.js";
import { useForm } from "../lib/useForm.js";

const RULES = { name: required("Isi nama mata kuliah.") };
const EMPTY = { name: "", kode: "", dosen: "" };

/** Halaman Mata Kuliah: form tambah dan daftar mata kuliah milik pengguna. */
export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm(EMPTY, RULES);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadCourses = useCallback(async () => {
    const res = await api.get("/courses");
    if (!mounted.current) return;
    setCourses(res.data.courses);
    setStatus("ready");
  }, []);

  const initialLoad = useCallback(() => {
    setStatus("loading");
    loadCourses().catch((err) => {
      if (!mounted.current || isSessionExpired(err)) return;
      setStatus("error");
    });
  }, [loadCourses]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.validate()) return;
    setSubmitting(true);
    try {
      await api.post("/courses", form.values);
      form.reset();
      await loadCourses();
    } catch (err) {
      if (isSessionExpired(err)) return;
      setError(err.response?.data?.error || "Gagal menambahkan mata kuliah. Coba lagi.");
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  /** Mengembalikan true bila mata kuliah terhapus (dipakai CourseRow untuk fokus). */
  async function handleDelete(id) {
    setActionError("");
    try {
      await api.delete(`/courses/${id}`);
    } catch (err) {
      if (isSessionExpired(err) || !mounted.current) return false;
      setActionError(err.response?.data?.error || "Gagal menghapus mata kuliah. Coba lagi.");
      return false;
    }
    try {
      await loadCourses();
    } catch (err) {
      if (!isSessionExpired(err) && mounted.current) {
        setActionError("Mata kuliah sudah terhapus, tetapi daftar belum diperbarui. Muat ulang halaman.");
      }
    }
    // Baris yang difokus sudah hilang; pindahkan fokus ke judul daftar.
    if (mounted.current) document.getElementById("daftar-mk")?.focus();
    return true;
  }

  return (
    <AppShell title="Mata Kuliah" description="Mata kuliah dipakai untuk mengelompokkan tugas.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Card aria-labelledby="daftar-mk" className="lg:order-1">
          <CardHeader id="daftar-mk" title="Daftar mata kuliah" focusable />
          <div className="mt-4 border-t border-line">
            {actionError && (
              <div className="px-4 pt-4 sm:px-6">
                <Alert>{actionError}</Alert>
              </div>
            )}
            {status === "loading" && (
              <ul aria-busy="true" aria-label="Memuat mata kuliah" className="divide-y divide-line">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex flex-col gap-2 px-4 py-4 sm:px-6">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </li>
                ))}
              </ul>
            )}
            {status === "error" && (
              <div className="p-4 sm:p-6">
                <Alert
                  title="Daftar mata kuliah tidak dapat dimuat."
                  action={
                    <Button variant="secondary" icon={RotateCw} onClick={initialLoad}>
                      Coba lagi
                    </Button>
                  }
                >
                  Tidak dapat memuat data. Coba lagi sebentar lagi.
                </Alert>
              </div>
            )}
            {status === "ready" && courses.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="Belum ada mata kuliah"
                description="Tambahkan mata kuliah agar tugas bisa dikelompokkan dan dicatat."
                action={
                  <Button icon={Plus} onClick={() => form.formRef.current?.querySelector("input")?.focus()}>
                    Tambah mata kuliah
                  </Button>
                }
              />
            )}
            {status === "ready" && courses.length > 0 && (
              <ul className="divide-y divide-line">
                {courses.map((c) => (
                  <CourseRow key={c.id} course={c} onDelete={handleDelete} />
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card aria-labelledby="tambah-mk" className="lg:order-2">
          <CardHeader id="tambah-mk" title="Tambah mata kuliah" />
          <CardContent>
            <form ref={form.formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <TextField label="Nama mata kuliah" placeholder="mis. Basis Data" {...form.field("name")} />
              <TextField label="Kode" optional placeholder="mis. IF2240" {...form.field("kode")} />
              <TextField label="Dosen pengampu" optional {...form.field("dosen")} />
              {error && <Alert>{error}</Alert>}
              <Button type="submit" icon={Plus} loading={submitting} loadingText="Menyimpan…">
                Tambah mata kuliah
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
