import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { email, required } from "../lib/validate.js";
import { useForm } from "../lib/useForm.js";

const RULES = {
  nama: required("Isi nama lengkap Anda."),
  email,
  password: (value) => (String(value ?? "").length >= 6 ? "" : "Gunakan password minimal 6 karakter.")
};

/** Halaman pendaftaran akun baru. Setelah berhasil, pengguna langsung login. */
export default function Register() {
  const form = useForm({ nama: "", email: "", password: "" }, RULES);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/auth/register", form.values);
      login(res.data.token, res.data.user);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mendaftar. Periksa koneksi lalu coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Daftar Akun StudyTrack"
      description="Catat mata kuliah dan tugas, lalu pantau deadline-nya di satu tempat."
      footer={
        <p>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
            Login di sini
          </Link>
        </p>
      }
    >
      <form ref={form.formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField label="Nama lengkap" autoComplete="name" {...form.field("nama")} />
        <TextField label="Email" type="email" autoComplete="email" placeholder="nama@kampus.ac.id" {...form.field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="Minimal 6 karakter."
          {...form.field("password")}
        />
        {error && <Alert>{error}</Alert>}
        <Button type="submit" icon={UserPlus} loading={submitting} loadingText="Memproses…" className="w-full">
          Daftar
        </Button>
      </form>
    </AuthLayout>
  );
}
