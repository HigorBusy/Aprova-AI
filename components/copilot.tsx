"use client";

import { Lock, MessageCircle, Sparkles } from "lucide-react";
import { Card, GhostButton } from "@/components/ui";

export function Copilot() {
  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <Card className="command-surface premium-glow flex min-h-[520px] flex-col items-center justify-center p-6 text-center lg:col-span-8 lg:min-h-[680px]">
        <div className="ai-orb" aria-hidden="true">
          <div className="ai-orb-core" />
        </div>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.22em] text-aura">Copiloto IA</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
          A inteligência da nave ainda está sendo calibrada.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
          Em breve, este espaço vai ler sua rotina, interpretar seus erros e transformar seus dados em orientação direta.
        </p>

        <div className="mt-8 w-full max-w-2xl rounded-lg border border-white/10 bg-black/25 p-2 text-left shadow-[0_0_36px_rgba(124,58,237,0.12)]">
          <div className="flex items-center gap-3 rounded-lg border border-accent/25 bg-white/[0.045] px-3 py-3 text-sm text-muted">
            <Sparkles className="h-4 w-4 text-aura" />
            <span>Pergunte ao Copiloto quando as IAs forem ativadas...</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:col-span-4">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.20em] text-muted">estado do módulo</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Em preparação</h3>
            </div>
            <Lock className="h-5 w-5 text-aura" />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            A interface já está pronta para receber o chat, mas as respostas de IA não foram conectadas nesta sprint.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-aura" />
            <h3 className="text-xl font-semibold text-white">O que ele fará</h3>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
            <p>Interpretar seus hábitos de estudo.</p>
            <p>Apontar gargalos antes que eles virem atraso.</p>
            <p>Sugerir a próxima ação com base no seu histórico.</p>
          </div>
        </Card>

        <GhostButton disabled className="w-full justify-center opacity-60">
          Aguardando conexão das IAs
        </GhostButton>
      </div>
    </div>
  );
}
