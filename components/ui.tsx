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
      className={clsx("glass rounded-xl p-4 shadow-command", className)}
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        "border border-[#f2c94c] bg-[#f2c94c] text-[#08111f] shadow-[0_12px_30px_rgba(2,7,15,0.28)] hover:bg-[#f8d866] hover:shadow-[0_16px_36px_rgba(2,7,15,0.34)]",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#8fa3b8]/20 bg-[#0f1e31]/80 px-4 py-2 text-sm font-semibold text-[#dce6ec] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#35bfe7]/45 hover:bg-[#14263d] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
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
  tone?: "blue" | "green" | "orange" | "aqua";
}) {
  const toneClass = {
    blue: "text-aura",
    green: "text-mint",
    orange: "text-amber",
    aqua: "text-aura"
  }[tone];

  return (
    <div className="rounded-lg border border-[#8fa3b8]/15 bg-[#0f1e31]/74 p-3 transition duration-200 hover:border-[#35bfe7]/28 hover:bg-[#13243a]">
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
    <div className={clsx("h-2 overflow-hidden rounded-full bg-[#050a12]/75", className)}>
      <div
        className="h-full rounded-full bg-[#35bfe7] transition-all duration-700 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
