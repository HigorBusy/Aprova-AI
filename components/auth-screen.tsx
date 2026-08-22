"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";

import { SignInPage, type AuthMode } from "@/components/ui/sign-in";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthScreenProps = {
  onAuthenticated: (user: User) => void;
  onBackToLanding?: () => void;
  initialMode?: AuthMode;
  onRecoveryComplete?: () => void;
};

export function AuthScreen({ onAuthenticated, onBackToLanding, initialMode = "login", onRecoveryComplete }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
    if (password.length < 6 || (mode !== "recovery" && !email)) {
      setMessage("Use um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "recovery") {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error || !data.user) {
          setMessage(error?.message ?? "Não foi possível atualizar sua senha.");
          return;
        }
        onRecoveryComplete?.();
        onAuthenticated(data.user);
        return;
      }

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
        setMessage("Conta criada. Confirme o e-mail para começar seu diagnóstico.");
        setMode("login");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.user) onAuthenticated(data.user);
    } catch (error) {
      setMessage(getAuthConnectionMessage(error));
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
    } catch (error) {
      setMessage(getAuthConnectionMessage(error));
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

function getAuthConnectionMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("bad gateway") ||
    normalized.includes("networkerror")
  ) {
    return "Não foi possível conectar ao servidor de login agora. O backend do AprovaAI pode estar iniciando; aguarde alguns minutos e tente novamente.";
  }

  return "Não foi possível concluir a conexão. Verifique sua internet e tente novamente.";
}
