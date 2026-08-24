"use client";

import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { useState } from "react";

import { EssayThemeGenerator } from "@/components/essay-theme-generator";
import { Loader } from "@/components/ui/loader-15";
import type { EssayReview } from "@/lib/ai/types";

type FreeEssayTrialProps = {
  onLogin: () => void;
};

const DEVICE_STORAGE_KEY = "aprovai_free_trial_device_v1";

export function FreeEssayTrial({ onLogin }: FreeEssayTrialProps) {
  const [theme, setTheme] = useState("");
  const [essay, setEssay] = useState("");
  const [review, setReview] = useState<EssayReview | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    if (theme.trim().length < 8) {
      setMessage("Informe o tema proposto para avaliarmos a Competência 2.");
      return;
    }
    if (essay.trim().length < 50) {
      setMessage("Cole uma redação com pelo menos 50 caracteres.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/public/essay-review", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ theme, essay, deviceId: getDeviceId() })
      });
      const payload = await response.json() as { review?: EssayReview; error?: string };
      if (!response.ok || !payload.review) {
        setMessage(payload.error ?? "Não foi possível corrigir sua redação agora.");
        return;
      }
      setReview(payload.review);
    } catch {
      setMessage("Não foi possível conectar ao corretor agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  if (review) {
    const competencies = Object.entries(review.competencies) as Array<[string, { score: number }]>;
    return (
      <section id="correcao-gratis" className="scroll-mt-8 border-y border-[#35bfe7]/20 bg-[#050a12] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#65d69e]">Correção gratuita concluída</p>
            <p className="mt-5 font-mono text-7xl font-semibold tracking-[-0.05em] text-[#f4f1e8] tabular-nums sm:text-8xl">{review.estimatedScore}</p>
            <p className="mt-2 text-sm text-[#8fa3b8]">nota estimada / 1000</p>
            <p className="mt-7 text-lg leading-8 text-[#c7d4df]">{review.diagnostico_geral || review.summary}</p>
          </div>
          <div className="rounded-2xl border border-[#8fa3b8]/18 bg-[#0b1829] p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {competencies.map(([key, competency]) => (
                <div key={key} className="rounded-xl border border-white/8 bg-[#08111f] p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-[#9de8fb]">{key}</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{competency.score}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 border-t border-[#8fa3b8]/15 pt-6">
              <p className="text-sm font-semibold text-[#f2c94c]">Seu próximo passo</p>
              <p className="mt-2 leading-7 text-[#c7d4df]">{review.proxima_tarefa_recomendada || review.improvements[0]}</p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onLogin} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-5 font-bold text-[#08111f] transition hover:bg-[#f8d866]">Entrar para continuar <ArrowRight className="h-4 w-4" /></button>
              <a href="#planos" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-[#8fa3b8]/25 px-5 font-semibold text-[#f4f1e8] transition hover:border-[#35bfe7]/55 hover:bg-[#13243a]">Ver planos</a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="correcao-gratis" className="scroll-mt-8 border-y border-[#35bfe7]/20 bg-[#050a12] px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#65d69e]/30 bg-[#65d69e]/10 px-4 py-2 text-sm font-semibold text-[#8ff0bb]"><CheckCircle2 className="h-4 w-4" /> Primeira correção por nossa conta</span>
          <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">Descubra agora onde sua redação perde pontos.</h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#9fb1c1]">Sem criar conta e sem cartão. Você recebe nota estimada, análise por competência e um próximo passo claro.</p>
          <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[#8fa3b8]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#65d69e]" /> Uma correção gratuita por dispositivo. Seu texto não é publicado.</p>
        </div>
        <div className="rounded-2xl border border-[#8fa3b8]/18 bg-[#0b1829] p-5 shadow-[0_30px_90px_rgba(2,7,15,0.45)] sm:p-8">
          <EssayThemeGenerator
            onSelect={(proposal) => {
              setTheme(proposal.title);
              setMessage("Tema selecionado. Escreva sua redação abaixo.");
            }}
          />
          <label className="mt-5 grid gap-2 text-sm font-semibold text-[#dce6ec]">Tema escolhido<input value={theme} onChange={(event) => setTheme(event.target.value)} maxLength={300} placeholder="Ex: Desafios para a valorização da herança africana no Brasil" className="min-h-12 rounded-lg border border-[#8fa3b8]/20 bg-[#08111f] px-4 text-base font-normal outline-none transition placeholder:text-[#607689] focus:border-[#35bfe7]/65" /></label>
          <label className="mt-5 grid gap-2 text-sm font-semibold text-[#dce6ec]">Sua redação<textarea value={essay} onChange={(event) => setEssay(event.target.value)} maxLength={30_000} rows={12} placeholder="Cole sua redação completa aqui..." className="min-h-[280px] resize-y rounded-lg border border-[#8fa3b8]/20 bg-[#08111f] p-4 text-base font-normal leading-7 outline-none transition placeholder:text-[#607689] focus:border-[#35bfe7]/65" /></label>
          <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#8fa3b8]"><span>{wordCount} palavras</span><span>1 correção gratuita</span></div>
          {message ? <p role="status" className="mt-4 rounded-lg border border-[#ff8b8b]/25 bg-[#ff6b6b]/10 p-4 text-sm leading-6 text-[#ffd0d0]">{message}</p> : null}
          <button type="button" onClick={() => void submit()} disabled={submitting} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-6 font-bold text-[#08111f] transition hover:bg-[#f8d866] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <><Loader size="sm" /> Corrigindo pelas 5 competências...</> : <>Corrigir gratuitamente <ArrowRight className="h-4 w-4" /></>}</button>
        </div>
      </div>
    </section>
  );
}

function getDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;

  const generated = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DEVICE_STORAGE_KEY, generated);
  return generated;
}
