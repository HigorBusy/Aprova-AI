"use client";

import type { User } from "@supabase/supabase-js";
import { CreditCard, LogOut, ShieldCheck } from "lucide-react";

import { Loader } from "@/components/ui/loader-15";
import { Card, GhostButton } from "@/components/ui";
import type { PlanTag } from "@/lib/types";

type AuthCardProps = {
  user: User;
  planTag: PlanTag;
  creditBalance: number | null;
  onSignOut: () => void;
};

export function AuthCard({ user, planTag, creditBalance, onSignOut }: AuthCardProps) {
  return (
    <Card className="p-5 lg:hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-aura">
            <ShieldCheck className="h-4 w-4" />
            Perfil sincronizado
          </p>
          <p className="mt-2 truncate text-sm text-slate-200">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
            Plano {planTag === "premium" ? "Premium" : "Free"}
          </p>
        </div>
        <div className="text-right">
          <CreditCard className="ml-auto h-4 w-4 text-aura" />
          <div className="mt-2 min-h-7 text-xl font-semibold text-white">
            {creditBalance === null ? <Loader size="sm" /> : creditBalance}
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">créditos</p>
        </div>
      </div>
      <GhostButton onClick={onSignOut} className="mt-4 w-full">
        <LogOut className="h-4 w-4" />
        Encerrar sessão
      </GhostButton>
    </Card>
  );
}
