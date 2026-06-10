"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button, Card, GhostButton } from "@/components/ui";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthCard({ user }: { user: User | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <Card>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">nuvem</p>
        <h2 className="mt-2 text-xl font-light text-white">Modo local ativo</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          O sistema funciona neste dispositivo. Com Supabase ativo, a evolução acompanha sua conta.
        </p>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-200">Evolução sincronizada</p>
          <p className="truncate text-sm text-slate-400">{user.email}</p>
        </div>
        <GhostButton onClick={() => void supabase.auth.signOut()} className="shrink-0">
          Sair
        </GhostButton>
      </Card>
    );
  }

  async function submit(mode: "login" | "signup") {
    if (!supabase || !email.trim() || password.length < 6) {
      setMessage("Use e-mail válido e senha com pelo menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    setMessage(
      response.error
        ? response.error.message
        : mode === "signup"
          ? "Conta criada. Se a confirmação por e-mail estiver ativa, confirme antes de entrar."
          : "Sessão iniciada. Sua evolução está sincronizada."
    );
  }

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">conta</p>
      <h2 className="mt-2 text-xl font-light text-white">Sincronizar evolução</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="email@exemplo.com"
          className="h-11 rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-300/50"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Senha"
          className="h-11 rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-300/50"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
        <Button disabled={submitting} onClick={() => void submit("login")}>
          Entrar
        </Button>
        <GhostButton disabled={submitting} onClick={() => void submit("signup")}>
          Criar conta
        </GhostButton>
      </div>
      {message && <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>}
    </Card>
  );
}
