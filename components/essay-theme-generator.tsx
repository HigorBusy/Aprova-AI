"use client";

import { useState } from "react";
import { BookOpenText, Check, Dice5, History, Lightbulb } from "lucide-react";

import {
  ESSAY_THEME_CATEGORIES,
  pickEssayTheme,
  type EssayThemeCategory,
  type EssayThemeOrigin,
  type EssayThemeProposal
} from "@/lib/essay-themes";

type EssayThemeGeneratorProps = {
  onSelect: (proposal: EssayThemeProposal) => void;
};

export function EssayThemeGenerator({ onSelect }: EssayThemeGeneratorProps) {
  const [category, setCategory] = useState<"all" | EssayThemeCategory>("all");
  const [origin, setOrigin] = useState<"all" | EssayThemeOrigin>("all");
  const [proposal, setProposal] = useState<EssayThemeProposal | null>(null);
  const [searched, setSearched] = useState(false);

  function generate() {
    setSearched(true);
    setProposal((current) => pickEssayTheme(category, origin, current?.id));
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#35bfe7]/20 bg-[#07101d]">
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9de8fb]">
              <Dice5 className="h-4 w-4" /> Gerador de propostas
            </div>
            <p className="mt-2 text-sm leading-6 text-[#8fa3b8]">Escolha um eixo e receba uma proposta para começar com contexto, não com uma página vazia.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[560px]">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-300">
              Categoria
              <select value={category} onChange={(event) => setCategory(event.target.value as "all" | EssayThemeCategory)} className="min-h-11 rounded-lg border border-white/10 bg-[#0d1b2d] px-3 text-sm text-white outline-none focus:border-[#35bfe7]/60">
                {ESSAY_THEME_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-300">
              Origem
              <select value={origin} onChange={(event) => setOrigin(event.target.value as "all" | EssayThemeOrigin)} className="min-h-11 rounded-lg border border-white/10 bg-[#0d1b2d] px-3 text-sm text-white outline-none focus:border-[#35bfe7]/60">
                <option value="all">Oficiais e autorais</option>
                <option value="official">Já caiu no ENEM</option>
                <option value="training">Treinos possíveis para 2026</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={generate} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#35bfe7] px-5 text-sm font-bold text-[#06111d] transition hover:bg-[#69d4f1]">
            <Dice5 className="h-4 w-4" /> Sortear tema
          </button>
        </div>
      </div>

      {proposal ? (
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${proposal.origin === "official" ? "bg-[#65d69e]/12 text-[#82e8b6]" : "bg-[#f2c94c]/12 text-[#f5d96e]"}`}>
              {proposal.origin === "official" ? `Tema oficial · ENEM ${proposal.year}` : "Treino autoral · 2026"}
            </span>
            <span className="text-xs text-[#70869a]">A proposta futura é treino, não previsão garantida.</span>
          </div>
          <h3 className="mt-4 max-w-4xl text-xl font-semibold leading-7 text-white sm:text-2xl">{proposal.title}</h3>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#a8bac8]">{proposal.context}</p>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {proposal.motivatingPoints.map((point) => (
              <article key={`${proposal.id}-${point.source}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-[#9de8fb]"><BookOpenText className="h-3.5 w-3.5" /> {point.source}</p>
                <p className="mt-2 text-sm leading-6 text-[#c4d1dc]">{point.summary}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-[#8fa3b8]"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#f2c94c]" /> Use os textos como ponto de partida. Construa sua própria tese, argumentos e intervenção.</p>
            <button type="button" onClick={() => onSelect(proposal)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#35bfe7]/35 bg-[#10263b] px-5 text-sm font-semibold text-white transition hover:border-[#35bfe7]/70 hover:bg-[#15324e]">
              <Check className="h-4 w-4" /> Escrever sobre este tema
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center gap-3 p-5 text-center text-sm text-[#8fa3b8]"><History className="h-5 w-5 shrink-0 text-[#35bfe7]" /> {searched ? "Não há tema oficial nesse recorte. Escolha ‘Oficiais e autorais’ para ampliar o sorteio." : "Selecione os filtros e sorteie sua primeira proposta."}</div>
      )}
    </section>
  );
}
