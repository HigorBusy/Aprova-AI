"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, LockKeyhole, Mail, UserRound, type LucideIcon } from "lucide-react";

import { Loader } from "@/components/ui/loader-15";

type Status = "idle" | "success" | "error";

export function ActivationPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          code: String(formData.get("code") ?? ""),
          password: String(formData.get("password") ?? "")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Não foi possível ativar seu acesso.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Acesso ativado.");
      window.setTimeout(() => {
        window.location.assign("/");
      }, 1800);
    } catch {
      setStatus("error");
      setMessage("Falha de conexão ao ativar o acesso. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#05090b] px-5 py-8 text-[#e8eee8] sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(239,182,90,0.18),transparent_25rem),radial-gradient(circle_at_82%_18%,rgba(58,167,216,0.16),transparent_31rem),linear-gradient(140deg,#05090b_0%,#071014_55%,#101512_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(232,238,232,0.035)_1px,transparent_1px),linear-gradient(rgba(232,238,232,0.026)_1px,transparent_1px)] [background-size:72px_72px] opacity-40" />

      <a
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e8eee8]/15 bg-[#071014]/70 px-3 text-xs font-semibold text-[#c9d4cc] backdrop-blur-xl transition hover:border-[#3aa7d8]/45 hover:text-[#e8eee8] sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-[#3aa7d8]" />
        Login
      </a>

      <section className="relative z-10 w-full max-w-[500px] rounded-[2rem] border border-[#e8eee8]/15 bg-[#061014]/78 p-5 shadow-[0_34px_110px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-7">
        <div className="mx-auto mb-7 flex h-24 w-full max-w-[300px] items-center justify-center rounded-[2rem] border border-[#e8eee8]/10 bg-[#071014]/38 px-7 shadow-[0_0_70px_rgba(58,167,216,0.08)] backdrop-blur-xl">
          <img src="/pontuei-logo-lockup.svg" alt="Pontuei" className="h-16 w-auto max-w-full object-contain" />
        </div>

        <div className="rounded-2xl border border-[#efb65a]/25 bg-[#efb65a]/10 p-4">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#f0c777]">Acesso após compra</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.06em] text-[#e8eee8] sm:text-4xl">
            Ative sua conta do Pontuei.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#c9d4cc]">
            Use o e-mail informado na Cakto e o código do pedido exibido no comprovante. Cada compra só pode ser ativada uma vez.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field icon={UserRound} label="Nome" name="name" placeholder="Seu nome" autoComplete="name" />
          <Field icon={Mail} label="E-mail da compra" name="email" placeholder="voce@exemplo.com" type="email" autoComplete="email" required />
          <Field icon={KeyRound} label="Código do pedido" name="code" placeholder="Código exibido pela Cakto" required />
          <Field icon={LockKeyhole} label="Criar senha" name="password" placeholder="Mínimo de 8 caracteres" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />

          {message && (
            <p className={`rounded-2xl border p-3 text-sm leading-6 ${
              status === "success"
                ? "border-[#9fcf8b]/30 bg-[#9fcf8b]/10 text-[#dff5d7]"
                : "border-[#efb65a]/30 bg-[#efb65a]/10 text-[#f7d38f]"
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef6ef] via-[#b8dca8] to-[#64c3ed] px-4 font-semibold text-[#041014] shadow-[0_22px_70px_rgba(58,167,216,0.16),0_0_42px_rgba(159,207,139,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader size="sm" /> : "Ativar acesso"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#c9d4cc]">
      {label}
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8bd8f8]" />
        <input
          {...props}
          className="h-12 w-full rounded-2xl border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-11 text-sm text-[#e8eee8] outline-none backdrop-blur-xl transition placeholder:text-[#84938b] focus:border-[#3aa7d8]/60 focus:bg-[#3aa7d8]/10 focus:shadow-[0_0_30px_rgba(58,167,216,0.16)]"
        />
      </span>
    </label>
  );
}
