"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";

import { SignInPage, type AuthMode } from "@/components/ui/sign-in";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthScreenProps = {
  onAuthenticated: (user: User) => void;
  onBackToLanding?: () => void;
};

export function AuthScreen({ onAuthenticated, onBackToLanding }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit({
    email,
    password,
    name
  }: {
    email: string;
    password: string;
    name?: string;
  }) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage("A conexão com o Supabase não está configurada.");
      return;
    }
    if (!email || password.length < 6) {
      setMessage("Use um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name ?? "Candidato" }
          }
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        if (data.user && data.session) {
          onAuthenticated(data.user);
          return;
        }
        setMessage("Conta criada. Confirme o e-mail para entrar na Central de Controle.");
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.user) onAuthenticated(data.user);
    } catch {
      setMessage("Não foi possível concluir a conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(email: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !email) {
      setMessage("Digite seu e-mail antes de solicitar a redefinição.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      setMessage(error ? error.message : "Enviamos as instruções de redefinição para seu e-mail.");
    } catch {
      setMessage("Não foi possível solicitar a redefinição. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SignInPage
      mode={mode}
      message={message}
      submitting={submitting}
      onModeChange={(nextMode) => {
        setMode(nextMode);
        setMessage("");
      }}
      onSubmit={(data) => void submit(data)}
      onResetPassword={(email) => void resetPassword(email)}
      onBackToLanding={onBackToLanding}
    />
  );
}
