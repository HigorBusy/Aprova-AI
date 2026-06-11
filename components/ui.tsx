import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
}) {
  return (
    <section
      className={clsx("glass rounded-lg p-4 shadow-command transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.052]", className)}
      {...props}
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        "border border-accent/30 bg-accent text-white shadow-[0_0_34px_rgba(124,58,237,0.30)] hover:bg-violet hover:shadow-[0_0_44px_rgba(168,85,247,0.34)]",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:border-accent/40 hover:bg-white/[0.07] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
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
    blue: "text-aura",
    green: "text-emerald-200",
    orange: "text-amber-200",
    purple: "text-aura"
  }[tone];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:border-accent/25 hover:bg-white/[0.052]">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className={clsx("mt-2 break-words text-xl font-medium leading-tight sm:text-2xl", toneClass)}>
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
        className="h-full rounded-full bg-gradient-to-r from-cosmic via-violet to-accent shadow-[0_0_24px_rgba(168,85,247,0.36)] transition-all duration-700 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
