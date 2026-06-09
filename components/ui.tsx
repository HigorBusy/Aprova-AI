import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "glass rounded-xl p-4 shadow-soft transition-all duration-200",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        "bg-ocean text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-ink transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm active:scale-[0.97]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Stat({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-violet-50 text-violet-700",
  }[tone];

  return (
    <div className="rounded-xl border border-white/70 bg-white/70 p-3 transition-all duration-200 hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className={clsx("mt-2 rounded-lg px-2 py-1 text-lg font-black", toneClass)}>
        {value}
      </p>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={clsx("h-3 overflow-hidden rounded-full bg-slate-200/80", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-mint via-ocean to-reward transition-all duration-700 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
