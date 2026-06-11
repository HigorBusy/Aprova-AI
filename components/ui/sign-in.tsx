"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";

import { Loader } from "@/components/ui/loader-15";

export type AuthMode = "login" | "signup";

type SignInPageProps = {
  mode: AuthMode;
  message?: string;
  submitting?: boolean;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  onResetPassword: (email: string) => void;
};

export function SignInPage({
  mode,
  message,
  submitting = false,
  onModeChange,
  onSubmit,
  onResetPassword
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "").trim() || undefined
    });
  }

  return (
    <main className="mission-grid grid min-h-[100dvh] bg-canvas text-white lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md animate-float-in">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image
              src="/aprova-ai-glow.jpg"
              alt="AprovaAI"
              width={180}
              height={72}
              priority
              className="h-auto w-40 object-contain"
            />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.22em] text-aura">
            Central de controle
          </p>
          <h1 className="energy-text mt-4 text-4xl font-semibold leading-[1.04] text-white sm:text-5xl">
            {mode === "login" ? "Retome sua rota." : "Comece sua missão."}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Entre para acessar seu plano, seus créditos e a ferramenta que transforma cada redação em direção.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block text-sm font-medium text-slate-300">
                Nome
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Como devemos chamar você?"
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-accent/60 focus:bg-accent/10 focus:shadow-[0_0_28px_rgba(124,58,237,0.16)]"
                />
              </label>
            )}

            <label className="block text-sm font-medium text-slate-300">
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-accent/60 focus:bg-accent/10 focus:shadow-[0_0_28px_rgba(124,58,237,0.16)]"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Senha
              <span className="relative mt-2 block">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="Mínimo de 6 caracteres"
                  className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 pr-12 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-accent/60 focus:bg-accent/10 focus:shadow-[0_0_28px_rgba(124,58,237,0.16)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 grid place-items-center text-slate-500 transition hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onResetPassword(email)}
                  className="text-sm text-aura transition hover:text-white"
                >
                  Redefinir senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-lg border border-accent/30 bg-accent px-4 font-semibold text-white shadow-[0_0_36px_rgba(124,58,237,0.30)] transition hover:bg-violet hover:shadow-[0_0_48px_rgba(168,85,247,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader size="sm" />
              ) : mode === "login" ? (
                "Entrar na Central"
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? "Ainda não tem conta?" : "Já possui uma conta?"}{" "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
              className="font-medium text-aura transition hover:text-white"
            >
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </section>

      <section className="relative hidden min-h-[100dvh] overflow-hidden border-l border-white/10 lg:block">
        <div className="absolute inset-4 overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow-command">
          <Image
            src="/aprova-ai-glow.jpg"
            alt="Identidade visual AprovaAI"
            fill
            priority
            sizes="55vw"
            className="object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 xl:p-12">
            <div className="max-w-xl rounded-lg border border-white/10 bg-black/50 p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-aura">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">AprovaAI</span>
              </div>
              <p className="mt-4 text-2xl font-semibold leading-tight text-white xl:text-3xl">
                Ninguém está vindo te salvar, então faça acontecer.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="h-4 w-4 text-aura" />
                Sua rota e seus créditos protegidos pela sua conta.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
