import React from "react";
import { cn } from "../../lib/cn.js";

/*
 * Kartu L1 dengan border 1px tipis, diadaptasi dari anatomi Card di Watermelon
 * UI Card 1 (header berjudul + deskripsi, lalu konten). Bayangan tebal
 * bawaannya (`shadow-xl`) diganti bayangan halus token `shadow-soft`.
 */

export function Card({ as: Tag = "section", className, children, ...rest }) {
  return (
    <Tag className={cn("rounded-lg border border-line bg-surface shadow-soft", className)} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Header kartu dengan judul (h2 secara default) dan deskripsi opsional.
 *
 * @param {object} props
 * @param {string} [props.id] Id judul, untuk `aria-labelledby` pada kartu.
 * @param {"h1" | "h2" | "h3"} [props.level]
 * @param {boolean} [props.focusable] Judul bisa menerima fokus terprogram (tabIndex -1).
 */
export function CardHeader({ title, description, id, level = "h2", focusable = false, className }) {
  const Heading = level;
  return (
    <div className={cn("flex flex-col gap-1 px-4 pt-4 sm:px-6 sm:pt-6", className)}>
      <Heading
        id={id}
        tabIndex={focusable ? -1 : undefined}
        className={cn(level === "h1" ? "text-h2" : "text-h3", focusable && "focus:outline-none")}
      >
        {title}
      </Heading>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn("p-4 sm:p-6", className)}>{children}</div>;
}
