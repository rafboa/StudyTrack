import React from "react";
import Navbar from "./Navbar.jsx";
import { Card, CardContent, CardHeader } from "./ui/Card.jsx";

/**
 * Tata letak halaman login dan daftar: kartu form di tengah, tanpa menu aplikasi.
 * Anatomi kartu mengikuti Watermelon UI Card 1 (judul, deskripsi, field, aksi).
 */
export default function AuthLayout({ title, description, children, footer }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
        <Card aria-labelledby="auth-title">
          <CardHeader id="auth-title" level="h1" title={title} description={description} />
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="flex flex-col gap-2 px-1 text-sm text-muted">{footer}</div>}
      </main>
    </>
  );
}
