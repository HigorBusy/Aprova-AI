"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthScreen } from "@/components/auth-screen";
import { LandingPage } from "@/components/landing-page";

export function SalesPageEntry() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <AuthScreen
        onAuthenticated={() => router.push("/")}
        onBackToLanding={() => setShowAuth(false)}
      />
    );
  }

  return <LandingPage onStart={() => setShowAuth(true)} />;
}
