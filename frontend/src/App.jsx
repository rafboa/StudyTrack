import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Courses from "./pages/Courses.jsx";
import Tasks from "./pages/Tasks.jsx";
import ConnectionError from "./components/ConnectionError.jsx";

/**
 * Membungkus halaman yang hanya boleh diakses setelah login. Bila sesi belum
 * dapat diverifikasi karena server tidak terjangkau, tampilkan layar Coba lagi
 * (tanpa redirect dan tanpa merender halaman terlindungi).
 */
function ProtectedRoute({ children }) {
  const { user, loading, connectionError, retry } = useAuth();
  if (loading) {
    return (
      <p role="status" className="px-4 py-12 text-center text-sm text-muted">
        Memuat...
      </p>
    );
  }
  if (!user && connectionError) return <ConnectionError onRetry={retry} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Daftar route aplikasi. `/` diarahkan ke Daftar Tugas. */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
