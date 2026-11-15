import React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn.js";

/*
 * Diadaptasi dari Watermelon UI: Button 1 (solid), Button 11 (aksi hapus
 * berwarna merah) dan Button 25 (spinner saat memuat). Warna langit, gradien
 * dan bayangan bawaannya diganti dengan token StudyTrack.
 */

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover border border-accent hover:border-accent-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-muted",
  danger: "bg-surface text-danger border border-line-strong hover:border-danger hover:bg-danger-soft",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-surface-muted hover:text-ink"
};

/**
 * Tombol dasar. Tinggi minimal 44px agar mudah disentuh.
 *
 * @param {object} props
 * @param {"primary" | "secondary" | "danger" | "ghost"} [props.variant]
 * @param {boolean} [props.loading] Menampilkan spinner dan `aria-busy`; tombol tetap bisa difokus.
 * @param {string} [props.loadingText] Label pengganti selama memuat.
 * @param {React.ComponentType} [props.icon] Ikon lucide di kiri label.
 */
const Button = React.forwardRef(function Button(
  { variant = "primary", loading = false, loadingText, icon: Icon, className, children, type = "button", onClick, ...rest },
  ref
) {
  function handleClick(e) {
    // Selama memuat, klik ulang diabaikan tanpa mematikan tombol (fokus tidak hilang).
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }

  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        Icon && <Icon aria-hidden="true" className="size-4" />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});

export default Button;
