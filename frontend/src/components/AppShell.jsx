import React from "react";
import Navbar from "./Navbar.jsx";

/**
 * Kerangka halaman setelah login: skip link, navbar, lalu konten utama dengan
 * judul halaman dan deskripsi singkat.
 *
 * @param {object} props
 * @param {string} props.title Judul halaman (satu-satunya h1).
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions] Aksi di sisi kanan judul.
 */
export default function AppShell({ title, description, actions, children }) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only rounded-md bg-surface px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:absolute focus:inline-flex focus:min-h-11 focus:items-center focus:top-2 focus:left-2 focus:z-10"
      >
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="konten" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1">{title}</h1>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </>
  );
}
