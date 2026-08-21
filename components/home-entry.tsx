"use client";

import { useEffect, useState } from "react";

import { AprovaApp } from "@/components/aprova-app";
import { AuthScreen } from "@/components/auth-screen";
import { LandingPage } from "@/components/landing-page";
import { Loader } from "@/components/ui/loader-15";
import { getSupabaseClient } from "@/lib/supabase/client";

const SESSION_TIMEOUT_MS = 8_000;

export function HomeEntry() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;
    void withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      "Tempo limite ao verificar sessão."
    )
      .then(({ data }) => {
        if (!mounted) return;
        setHasSession(Boolean(data.session?.user));
      })
      .catch(() => {
        if (!mounted) return;
        setHasSession(false);
      })
      .finally(() => {
        if (!mounted) return;
        setCheckingSession(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setHasSession(false);
        setShowAuth(false);
      }
      if (event === "SIGNED_IN" && session?.user) {
        setHasSession(true);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5">
        <Loader size="lg" />
      </main>
    );
  }

  if (hasSession) return <AprovaApp />;

  if (showAuth) {
    return (
      <AuthScreen
        onAuthenticated={() => setHasSession(true)}
        onBackToLanding={() => setShowAuth(false)}
      />
    );
  }

  return <LandingPage onStart={() => setShowAuth(true)} />;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}
