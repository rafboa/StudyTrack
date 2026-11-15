import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import api, { isSessionExpired } from "../api.js";
import { INVALID_DEADLINE_MESSAGE, isValidDeadline } from "../lib/deadline.js";
import { required } from "../lib/validate.js";
import { useForm } from "../lib/useForm.js";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";
import { Card, CardContent, CardHeader } from "./ui/Card.jsx";
import { SelectField, TextAreaField, TextField } from "./ui/Field.jsx";

const RULES = {
  mata_kuliah_id: required("Pilih mata kuliah terlebih dahulu."),
  judul: required("Isi judul tugas."),
  deadline: (value) => {
    if (!String(value ?? "").trim()) return "Isi tanggal dan jam deadline.";
    return isValidDeadline(value) ? "" : INVALID_DEADLINE_MESSAGE;
  }
};
const EMPTY = { mata_kuliah_id: "", judul: "", deskripsi: "", deadline: "" };

/**
 * Form tambah tugas. Deadline dibaca sebagai WIB oleh server; validasinya
 * mengikuti aturan server, dan pesan 400 dari server tampil di field deadline.
 *
 * @param {object} props
 * @param {{ id: number, name: string }[]} props.courses
 * @param {() => Promise<void>} props.onCreated Dipanggil setelah tugas tersimpan.
 */
export default function TaskForm({ courses, onCreated }) {
  const form = useForm(EMPTY, RULES);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const noCourses = courses.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.validate()) return;
    setSubmitting(true);
    try {
      const { mata_kuliah_id, judul, deskripsi, deadline } = form.values;
      await api.post("/tasks", { mata_kuliah_id, judul, deskripsi, deadline });
      form.reset();
      await onCreated().catch((err) => {
        if (isSessionExpired(err) || err.stale) return;
        setNotice("Tugas sudah tersimpan, tetapi daftar belum diperbarui. Daftar akan diperbarui otomatis dalam 1 menit.");
      });
    } catch (err) {
      if (isSessionExpired(err)) return;
      const message = err.response?.data?.error;
      if (message === INVALID_DEADLINE_MESSAGE) {
        form.setFieldError("deadline", message);
      } else {
        setError(message || "Gagal menambahkan tugas. Periksa koneksi lalu coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card id="tambah-tugas" aria-labelledby="tambah-tugas-judul">
      <CardHeader id="tambah-tugas-judul" title="Tambah tugas" />
      <CardContent>
        <form ref={form.formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <SelectField
            label="Mata kuliah"
            hint={
              noCourses ? (
                <>
                  Belum ada mata kuliah.{" "}
                  <Link to="/courses" className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
                    Tambah mata kuliah
                  </Link>{" "}
                  dulu.
                </>
              ) : undefined
            }
            {...form.field("mata_kuliah_id")}
          >
            <option value="">Pilih mata kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Judul tugas" placeholder="mis. Laporan Praktikum 3" {...form.field("judul")} />
          <TextAreaField label="Deskripsi" optional rows={2} {...form.field("deskripsi")} />
          <TextField
            label="Deadline (WIB)"
            type="datetime-local"
            hint="Tanggal dan jam dibaca sebagai WIB (UTC+7)."
            {...form.field("deadline")}
          />
          {error && <Alert>{error}</Alert>}
          {notice && <Alert tone="info">{notice}</Alert>}
          <Button type="submit" icon={Plus} loading={submitting} loadingText="Menyimpan…">
            Tambah tugas
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
