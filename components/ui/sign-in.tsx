"use client";

import { useState } from "react";
import { ArrowLeft, CalendarClock, Eye, EyeOff } from "lucide-react";

import {
  GlassCard,
  GlassCardAction,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { Loader } from "@/components/ui/loader-15";

export type AuthMode = "login" | "signup" | "recovery";

type SignInPageProps = {
  mode: AuthMode;
  message?: string;
  submitting?: boolean;
  onModeChange?: (mode: AuthMode) => void;
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  onResetPassword: (email: string) => void;
  onBackToLanding?: () => void;
};

const classroomImage =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2400&auto=format&fit=crop";

export function SignInPage({
  mode,
  message,
  submitting = false,
  onModeChange,
  onSubmit,
  onResetPassword,
  onBackToLanding
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
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#05090b] px-5 py-8 text-[#e8eee8] sm:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.42]"
        style={{ backgroundImage: `url(${classroomImage})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(239,182,90,0.20),transparent_26rem),radial-gradient(circle_at_80%_10%,rgba(58,167,216,0.18),transparent_30rem),linear-gradient(110deg,rgba(3,6,7,0.96)_0%,rgba(5,9,11,0.86)_46%,rgba(5,9,11,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(232,238,232,0.035)_1px,transparent_1px),linear-gradient(rgba(232,238,232,0.026)_1px,transparent_1px)] [background-size:72px_72px] opacity-40" />

      {mode === "login" && onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute left-5 top-5 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e8eee8]/15 bg-[#071014]/70 px-3 text-xs font-semibold text-[#c9d4cc] backdrop-blur-xl transition hover:border-[#3aa7d8]/45 hover:text-[#e8eee8] sm:left-8 sm:top-8"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#3aa7d8]" />
          Landing
        </button>
      )}

      <section className="relative z-10 flex w-full items-center justify-center">
        <div className="w-full max-w-[460px] animate-float-in">
          <div className="mx-auto mb-7 flex h-24 w-full max-w-[300px] items-center justify-center rounded-[2rem] border border-[#e8eee8]/10 bg-[#071014]/38 px-7 shadow-[0_0_70px_rgba(58,167,216,0.08)] backdrop-blur-xl">
            <img
              src="/aprova-ai-logo-lockup.svg"
              alt="AprovaAI"
              className="h-16 w-auto max-w-full object-contain"
            />
          </div>

          <GlassCard className="border-[#e8eee8]/18 bg-[#061014]/70 shadow-[0_34px_110px_rgba(0,0,0,0.48)]">
            <GlassCardHeader>
              <GlassCardTitle className="text-4xl leading-[0.95] sm:text-5xl">
                {mode === "login"
                  ? "Volte para o treino."
                  : mode === "recovery"
                    ? "Defina sua nova senha."
                    : "Comece antes que vire reta final."}
              </GlassCardTitle>
              <GlassCardDescription className="mt-3">
                {mode === "login"
                  ? "O ENEM não espera você se sentir pronto. Entre e continue corrigindo com direção."
                  : mode === "recovery"
                    ? "Escolha uma senha segura para recuperar o acesso ao seu treino."
                    : "Crie sua conta e descubra onde sua redação está perdendo ponto enquanto ainda dá tempo de corrigir."}
              </GlassCardDescription>
              <GlassCardAction>
                <div className="rounded-full border border-[#efb65a]/25 bg-[#efb65a]/10 p-2 text-[#f0c777]">
                  <CalendarClock className="h-4 w-4" />
                </div>
              </GlassCardAction>
            </GlassCardHeader>

            <GlassCardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <label className="grid gap-2 text-sm font-semibold text-[#c9d4cc]">
                    Nome
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Como devemos chamar você?"
                      className="h-12 rounded-2xl border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-4 text-sm text-[#e8eee8] outline-none backdrop-blur-xl transition placeholder:text-[#84938b] focus:border-[#3aa7d8]/60 focus:bg-[#3aa7d8]/10 focus:shadow-[0_0_30px_rgba(58,167,216,0.16)]"
                    />
                  </label>
                )}

                {mode !== "recovery" && (
                  <label className="grid gap-2 text-sm font-semibold text-[#c9d4cc]">
                    E-mail
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@exemplo.com"
                      className="h-12 rounded-2xl border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-4 text-sm text-[#e8eee8] outline-none backdrop-blur-xl transition placeholder:text-[#84938b] focus:border-[#3aa7d8]/60 focus:bg-[#3aa7d8]/10 focus:shadow-[0_0_30px_rgba(58,167,216,0.16)]"
                    />
                  </label>
                )}

                <label className="grid gap-2 text-sm font-semibold text-[#c9d4cc]">
                  Senha
                  <span className="relative block">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      placeholder="Mínimo de 6 caracteres"
                      className="h-12 w-full rounded-2xl border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] px-4 pr-12 text-sm text-[#e8eee8] outline-none backdrop-blur-xl transition placeholder:text-[#84938b] focus:border-[#3aa7d8]/60 focus:bg-[#3aa7d8]/10 focus:shadow-[0_0_30px_rgba(58,167,216,0.16)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-3 grid place-items-center text-[#84938b] transition hover:text-[#e8eee8]"
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
                      className="text-sm font-medium text-[#8bd8f8] transition hover:text-[#e8eee8]"
                    >
                      Redefinir senha
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef6ef] via-[#b8dca8] to-[#64c3ed] px-4 font-semibold text-[#041014] shadow-[0_22px_70px_rgba(58,167,216,0.16),0_0_42px_rgba(159,207,139,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader size="sm" />
                  ) : mode === "login" ? (
                    "Entrar e continuar treinando"
                  ) : mode === "recovery" ? (
                    "Salvar nova senha"
                  ) : (
                    "Criar conta grátis"
                  )}
                </button>
              </form>
            </GlassCardContent>

            <GlassCardFooter className="flex-col gap-4">
              {message && (
                <p className="w-full rounded-2xl border border-[#e8eee8]/15 bg-[#e8eee8]/[0.055] p-3 text-sm leading-6 text-[#c9d4cc]">
                  {message}
                </p>
              )}
              {mode !== "recovery" && (
                <p className="text-center text-sm text-[#84938b]">
                  {mode === "login" ? "Ainda não tem conta?" : "Já possui uma conta?"}{" "}
                  <button
                    type="button"
                    onClick={() => onModeChange?.(mode === "login" ? "signup" : "login")}
                    className="font-semibold text-[#8bd8f8] transition hover:text-[#e8eee8]"
                  >
                    {mode === "login" ? "Teste uma correção grátis" : "Entrar"}
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p className="text-center text-xs leading-5 text-[#84938b]">
                  Sua conta começa com 5 créditos, suficientes para cinco correções completas.
                </p>
              )}
              {mode !== "recovery" && (
                <p className="text-center text-sm text-[#84938b]">
                  Comprou agora?{" "}
                  <a href="/ativar" className="font-semibold text-[#8bd8f8] transition hover:text-[#e8eee8]">
                    Ative seu acesso
                  </a>
                </p>
              )}
            </GlassCardFooter>
          </GlassCard>
        </div>
      </section>
    </main>
  );
}
