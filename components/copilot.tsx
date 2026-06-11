"use client";

import { Lock, MessageCircle } from "lucide-react";

import { AiInput } from "@/components/ui/ai-input";
import { Card } from "@/components/ui";

export function Copilot() {
  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <Card className="command-surface premium-glow flex min-h-[560px] flex-col items-center justify-center p-5 text-center sm:p-8 lg:col-span-9 lg:min-h-[700px]">
        <div className="ai-orb" aria-hidden="true">
          <div className="ai-orb-core" />
        </div>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.22em] text-aura">Copiloto IA</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
          Sua inteligÃªncia de bordo estÃ¡ sendo calibrada.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
          A interface estÃ¡ pronta. As respostas sÃ³ serÃ£o liberadas quando o motor de IA estiver conectado com seguranÃ§a.
        </p>
        <div className="mt-7 w-full">
          <AiInput disabled />
        </div>
      </Card>

      <div className="grid content-start gap-4 lg:col-span-3">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.20em] text-muted">estado do mÃ³dulo</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Em preparaÃ§Ã£o</h3>
            </div>
            <Lock className="h-5 w-5 text-aura" />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Nenhuma resposta Ã© simulada. O chat permanece bloqueado atÃ© a integraÃ§Ã£o real das IAs.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-aura" />
            <h3 className="text-xl font-semibold text-white">PrÃ³xima etapa</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Conectar contexto do aluno, histÃ³rico de redaÃ§Ãµes e recomendaÃ§Ãµes verificÃ¡veis.
          </p>
        </Card>
      </div>
    </div>
  );
}
