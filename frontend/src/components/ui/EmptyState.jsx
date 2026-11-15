import React from "react";

/**
 * Kondisi kosong: judul tentang apa yang seharusnya ada di sini, satu kalimat
 * manfaat, dan satu aksi utama. Tidak memakai ilustrasi dekoratif.
 *
 * @param {object} props
 * @param {React.ComponentType} [props.icon]
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} [props.action]
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {Icon && <Icon aria-hidden="true" className="mb-2 size-8 text-subtle" />}
      <h3 className="text-h3">{title}</h3>
      <p className="max-w-prose text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
