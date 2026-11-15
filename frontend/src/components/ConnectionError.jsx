import React from "react";
import { RotateCw } from "lucide-react";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";

/**
 * Tampil saat sesi tersimpan tidak dapat diverifikasi karena server tidak
 * terjangkau. Token tetap disimpan; pengguna cukup menekan Coba lagi.
 *
 * @param {object} props
 * @param {() => void} props.onRetry
 */
export default function ConnectionError({ onRetry }) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
      <h1 className="text-h3">StudyTrack</h1>
      <Alert
        title="Tidak dapat terhubung ke server."
        action={
          <Button variant="secondary" icon={RotateCw} onClick={onRetry}>
            Coba lagi
          </Button>
        }
      >
        Sesi Anda tetap tersimpan. Coba lagi sebentar lagi.
      </Alert>
    </main>
  );
}
