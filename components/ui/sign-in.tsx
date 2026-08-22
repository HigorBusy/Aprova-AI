"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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

export function SignInPage({ mode, message, submitting = false, onModeChange, onSubmit, onResetPassword, onBackToLanding }: SignInPageProps) {
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

  const title = mode === "login" ? "Continue de onde parou." : mode === "recovery" ? "Crie uma nova senha." : "Faça sua primeira correção.";
  const description = mode === "login" ? "Entre para acessar suas correções, créditos e evolução." : mode === "recovery" ? "Use uma senha segura com pelo menos seis caracteres." : "Sua conta começa com três correções completas para você conhecer o método.";

  return (
    <main className="grid min-h-[100dvh] bg-[#08111f] text-[#f4f1e8] lg:grid-cols-[0.94fr_1.06fr]">
      <section className="relative hidden overflow-hidden border-r border-[#8fa3b8]/15 bg-[#edf2f4] p-10 text-[#0b1726] lg:flex lg:flex-col lg:justify-between xl:p-14">
        <img src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" className="h-11 w-auto self-start object-contain brightness-[0.34] saturate-[1.4]" />
        <div className="relative mx-auto w-full max-w-xl rotate-[-1.2deg] rounded-2xl bg-white p-9 shadow-[0_34px_100px_rgba(20,43,63,0.16)]">
          <div className="flex items-center justify-between border-b border-[#d8e1e6] pb-5"><span className="text-sm font-semibold text-[#05799a]">Correção em andamento</span><strong className="font-mono text-3xl tabular-nums">760</strong></div>
          <div className="mt-7 space-y-5 text-[0.95rem] leading-8 text-[#344b5f]">
            <p>No cenário brasileiro, a desigualdade educacional permanece como um desafio <mark className="bg-[#ffe992] px-1 text-inherit">que exige ação coordenada</mark>.</p>
            <p>Entretanto, <span className="border-b-2 border-[#ff6b6b]">a falta de oportunidades é um problema</span> que afeta milhões de estudantes.</p>
          </div>
          <div className="mt-8 border-t border-[#d8e1e6] pt-5"><p className="text-xs font-semibold text-[#d94a4a]">Trecho genérico</p><p className="mt-2 text-sm leading-6 text-[#5b7082]">Explique qual oportunidade falta e como isso sustenta sua tese.</p></div>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#607689]">Sua redação volta com evidências, notas por competência e uma próxima tarefa clara.</p>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8">
        {mode === "login" && onBackToLanding ? <button type="button" onClick={onBackToLanding} className="absolute left-5 top-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#8fa3b8] transition hover:text-[#f4f1e8] sm:left-8 sm:top-8"><ArrowLeft className="h-4 w-4" /> Voltar</button> : null}
        <div className="w-full max-w-[440px] animate-float-in">
          <div className="mb-9 flex justify-center lg:hidden"><img src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" className="h-12 w-auto max-w-[240px] object-contain" /></div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#9fb1c1]">{description}</p>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" ? <Field label="Nome"><input name="name" type="text" autoComplete="name" placeholder="Como devemos chamar você?" className="auth-field" /></Field> : null}
            {mode !== "recovery" ? <Field label="E-mail"><input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="auth-field" /></Field> : null}
            <Field label="Senha">
              <span className="relative block"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} placeholder="Mínimo de 6 caracteres" className="auth-field pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 grid place-items-center text-[#8fa3b8] transition hover:text-[#f4f1e8]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span>
            </Field>
            {mode === "login" ? <div className="flex justify-end"><button type="button" onClick={() => onResetPassword(email)} className="text-sm font-semibold text-[#9de8fb] transition hover:text-white">Esqueci minha senha</button></div> : null}
            <button type="submit" disabled={submitting} className="flex min-h-13 w-full items-center justify-center rounded-lg bg-[#f2c94c] px-5 font-bold text-[#08111f] transition hover:bg-[#f8d866] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader size="sm" /> : mode === "login" ? "Entrar" : mode === "recovery" ? "Salvar nova senha" : "Criar conta e corrigir"}</button>
          </form>

          {message ? <p role="status" className="mt-5 rounded-lg border border-[#8fa3b8]/18 bg-[#0f1e31] p-4 text-sm leading-6 text-[#c7d4df]">{message}</p> : null}
          {mode !== "recovery" ? <div className="mt-7 space-y-4 text-center text-sm text-[#8fa3b8]"><p>{mode === "login" ? "Ainda não testou?" : "Já possui conta?"} <button type="button" onClick={() => onModeChange?.(mode === "login" ? "signup" : "login")} className="font-semibold text-[#9de8fb] hover:text-white">{mode === "login" ? "Faça três correções grátis" : "Entrar"}</button></p><p>Comprou um plano? <a href="/ativar" className="font-semibold text-[#9de8fb] hover:text-white">Ativar acesso</a></p></div> : null}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-[#c7d4df]">{label}{children}</label>;
}
