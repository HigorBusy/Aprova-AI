import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("glass rounded-lg p-4 shadow-command", className)}>
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        "border border-sky-300/25 bg-sky-400 text-slate-950 shadow-[0_0_34px_rgba(56,189,248,0.22)] hover:bg-sky-300",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-semibold text-slate-200 transition duration-200 hover:border-sky-300/30 hover:bg-white/[0.07] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
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
  tone = "blue"
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange" | "purple";
}) {
  const toneClass = {
    blue: "text-sky-200",
    green: "text-emerald-200",
    orange: "text-amber-200",
    purple: "text-indigo-200"
  }[tone];

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={clsx("mt-2 break-words text-xl font-light leading-tight sm:text-2xl", toneClass)}>
        {value}
      </p>
    </div>
  );
}

export function ProgressBar({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx("h-2 overflow-hidden rounded-full border border-white/10 bg-black/40", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-blue-500 shadow-[0_0_24px_rgba(56,189,248,0.34)] transition-all duration-700 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
