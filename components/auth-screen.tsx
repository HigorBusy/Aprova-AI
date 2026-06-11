"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";

import { SignInPage, type AuthMode } from "@/components/ui/sign-in";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthScreenProps = {
  onAuthenticated: (user: User) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
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
      setMessage("A conexÃ£o com o Supabase nÃ£o estÃ¡ configurada.");
      return;
    }
    if (!email || password.length < 6) {
      setMessage("Use um e-mail vÃ¡lido e uma senha com pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name ?? "Candidato" }
        }
      });
      setSubmitting(false);
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
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.user) onAuthenticated(data.user);
  }

  async function resetPassword(email: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !email) {
      setMessage("Digite seu e-mail antes de solicitar a redefiniÃ§Ã£o.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    setSubmitting(false);
    setMessage(error ? error.message : "Enviamos as instruÃ§Ãµes de redefiniÃ§Ã£o para seu e-mail.");
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
    />
  );
}
