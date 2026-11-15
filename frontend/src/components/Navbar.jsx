import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { cn } from "../lib/cn.js";

function navClass({ isActive }) {
  return cn(
    "inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-medium transition-colors duration-150",
    isActive ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
  );
}

/** Bilah navigasi atas. Menampilkan menu sesuai status login. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex min-h-14 items-center font-display text-h3 font-semibold text-ink"
        >
          StudyTrack
        </Link>

        {user ? (
          <>
            <nav aria-label="Navigasi utama" className="order-last flex w-full gap-6 sm:order-none sm:w-auto">
              <NavLink to="/tasks" className={navClass}>
                Daftar Tugas
              </NavLink>
              <NavLink to="/courses" className={navClass}>
                Mata Kuliah
              </NavLink>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden max-w-48 truncate text-sm text-muted md:inline">{user.nama}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Logout
              </button>
            </div>
          </>
        ) : (
          <nav aria-label="Akun" className="ml-auto flex gap-4">
            <NavLink to="/login" className={navClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={navClass}>
              Daftar
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
