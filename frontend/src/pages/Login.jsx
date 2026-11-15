import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { email, required } from "../lib/validate.js";
import { useForm } from "../lib/useForm.js";

const RULES = {
  email,
  password: required("Isi password Anda.")
};

/** Halaman login. Field sudah terisi akun demo agar mudah dicoba. */
export default function Login() {
  const form = useForm({ email: "demo@studytrack.test", password: "demo1234" }, RULES);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Pesan "sesi berakhir" disalin ke state lokal lalu dihapus dari riwayat,
  // supaya tidak muncul lagi setelah reload atau di samping galat login berikutnya.
  const [notice, setNotice] = useState(() => location.state?.message || "");

  useEffect(() => {
    if (location.state?.message) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", form.values);
      login(res.data.token, res.data.user);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal login. Periksa koneksi lalu coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Login ke StudyTrack"
      description="Lihat tugas yang paling dekat deadline-nya lebih dulu."
      footer={
        <>
          <p>
            Belum punya akun?{" "}
            <Link to="/register" className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover">
              Daftar di sini
            </Link>
          </p>
          <p>Akun demo sudah terisi otomatis (demo@studytrack.test / demo1234).</p>
        </>
      }
    >
      <form ref={form.formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {notice && <Alert tone="info">{notice}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" placeholder="nama@kampus.ac.id" {...form.field("email")} />
        <TextField label="Password" type="password" autoComplete="current-password" {...form.field("password")} />
        {error && <Alert>{error}</Alert>}
        <Button type="submit" icon={LogIn} loading={submitting} loadingText="Memproses…" className="w-full">
          Login
        </Button>
      </form>
    </AuthLayout>
  );
}
