import React, { useId } from "react";
import { cn } from "../../lib/cn.js";

/*
 * Field berlabel. Anatomi diadaptasi dari Watermelon UI: Textarea 3 (label di
 * atas, catatan bantuan di bawah), Select 2 (native select berlabel) dan Card 1
 * (field login setinggi 44px). Label selalu terlihat; placeholder hanya contoh
 * format. Pesan galat menggantikan teks bantuan di slot yang sama.
 */

const CONTROL =
  "block w-full rounded-md border bg-surface px-3 text-base text-ink transition-colors duration-150 " +
  "hover:border-muted focus-visible:border-accent";

function controlClass(invalid, extra) {
  return cn(CONTROL, invalid ? "border-danger" : "border-line-input", extra);
}

/**
 * Kerangka label + kontrol + bantuan/galat. `children` menerima props aksesibilitas.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.hint] Teks bantuan permanen.
 * @param {string} [props.error] Pesan galat; bila ada, kontrol ditandai invalid.
 * @param {boolean} [props.optional] Menambahkan keterangan "(opsional)" di label.
 * @param {(a11y: object) => React.ReactNode} props.children
 */
function FieldShell({ label, hint, error, optional, className, children }) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (opsional)</span>}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": note ? noteId : undefined
      })}
      {note && (
        <p id={noteId} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Input teks berlabel. Props lain diteruskan ke `<input>`. */
export function TextField({ label, hint, error, optional, className, inputClassName, ...rest }) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => <input {...a11y} {...rest} className={controlClass(error, cn("min-h-11", inputClassName))} />}
    </FieldShell>
  );
}

/** Textarea berlabel. */
export function TextAreaField({ label, hint, error, optional, className, ...rest }) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => <textarea {...a11y} {...rest} className={controlClass(error, "min-h-20 resize-y py-2")} />}
    </FieldShell>
  );
}

/** Native select berlabel (dari Watermelon Select 2). */
export function SelectField({ label, hint, error, optional, className, children, ...rest }) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => (
        <select {...a11y} {...rest} className={controlClass(error, "min-h-11 cursor-pointer")}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}
