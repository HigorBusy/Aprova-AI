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
    <section className={clsx("glass rounded-lg p-4 shadow-soft", className)}>
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        "bg-gradient-to-r from-ocean via-cyan to-mint text-white shadow-glow hover:brightness-110",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:border-ocean/50 hover:bg-ocean/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
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
    blue: "from-ocean/25 to-cyan/10 text-cyan",
    green: "from-mint/25 to-emerald-400/10 text-mint",
    orange: "from-reward/25 to-amber-300/10 text-amber-300",
    purple: "from-grape/25 to-fuchsia-400/10 text-violet-200"
  }[tone];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className={clsx("mt-2 rounded-md bg-gradient-to-br px-2 py-1 text-lg font-black", toneClass)}>
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
    <div className={clsx("h-3 overflow-hidden rounded-full bg-slate-800", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-mint via-cyan to-ocean shadow-[0_0_24px_rgba(34,211,238,0.42)] transition-all duration-700 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}