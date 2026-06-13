
"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowDown, CreditCard, FileText, Radar, Route, Upload } from "lucide-react";

import { AuthCard } from "@/components/auth-card";
import { Button, Card, Stat } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import { getDaysToEnem, getEnemCountdown } from "@/lib/constants";
import type { PlanTag, StudyState } from "@/lib/types";

type DashboardProps = {
  state: StudyState;
  user: User;
  planTag: PlanTag;
  creditBalance: number | null;
  onSignOut: () => void;
};

const flightBars = [18, 22, 28, 34, 42, 56, 68, 76, 72, 84, 66, 58, 49, 40, 31, 24];

export function Dashboard({
  state,
  user,
  planTag,
  creditBalance,
  onSignOut
}: DashboardProps) {
  const studiedHours = formatHours(state.studiedMinutesToday);
  const totalHours = formatHours(state.totalMinutes);
  const activeDays = state.weeklyMinutes.filter((minutes) => minutes > 0).length;
  const consistency = Math.round((activeDays / 7) * 100);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <CountdownPanel className="lg:col-span-12" />

      <WritingCenterCard
        className="lg:col-span-8 lg:row-span-2"
        balance={creditBalance}
        planTag={planTag}
      />

      <div className="grid content-start gap-4 lg:col-span-4">
        <RecommendedAction />
        <CreditsCard balance={creditBalance} planTag={planTag} />
      </div>

      <Card className="lg:col-span-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-aura">
              <Radar className="h-4 w-4" />
              Telemetria real
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {state.studiedMinutesToday > 0
                ? "Seu ritmo de hoje foi registrado."
                : "Ainda não há sinal de estudo hoje."}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              O painel acompanha apenas dados registrados. Sem atividade, não inventamos progresso.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
            <Stat label="hoje" value={studiedHours} tone="green" />
            <Stat label="acumulado" value={totalHours} tone="blue" />
            <Stat label="consistência" value={`${consistency}%`} tone="purple" />
          </div>
        </div>
      </Card>

      <div className="lg:col-span-12">
        <AuthCard
          user={user}
          planTag={planTag}
          creditBalance={creditBalance}
          onSignOut={onSignOut}
        />
      </div>
    </div>
  );
}

function CountdownPanel({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => getEnemCountdown(now), [now]);
  const daysToEnem = getDaysToEnem(now);

  return (
    <Card className={`command-surface premium-glow p-5 sm:p-7 lg:p-8 ${className ?? ""}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-aura">
            Contagem regressiva para o ENEM
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            O tempo vai passar de qualquer jeito.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Provas confirmadas para 8 e 15 de novembro de 2026. O painel conta até o primeiro dia.
          </p>
        </div>
        <div className="rounded-lg border border-accent/25 bg-black/25 px-4 py-3 text-right shadow-[0_0_34px_rgba(124,58,237,0.20)]">
          <p className="energy-text text-5xl font-semibold text-white sm:text-6xl">{daysToEnem}</p>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">dias totais</p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/25 p-2 sm:grid-cols-5 sm:gap-3 sm:p-3">
        <CountdownUnit label="meses" value={countdown.months} />
        <CountdownUnit label="dias" value={countdown.days} />
        <CountdownUnit label="horas" value={countdown.hours} />
        <CountdownUnit label="min" value={countdown.minutes} />
        <CountdownUnit label="seg" value={countdown.seconds} pulse />
      </div>

      <div className="mt-6 h-20 overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 pt-4 sm:h-24">
        <div className="flex h-full items-end gap-1 scanline">
          {flightBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="block flex-1 rounded-t bg-gradient-to-t from-cosmic via-violet to-aura opacity-80 shadow-[0_0_18px_rgba(168,85,247,0.24)]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function CountdownUnit({ label, value, pulse }: { label: string; value: number; pulse?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] px-1 py-3 text-center sm:px-2">
      <p
        key={value}
        className={`countdown-value energy-text text-2xl font-semibold text-white sm:text-5xl lg:text-6xl ${pulse ? "signal-pulse" : ""}`}
      >
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.08em] text-muted sm:text-[0.62rem]">
        {label}
      </p>
    </div>
  );
}

function WritingCenterCard({
  className,
  balance,
  planTag
}: {
  className?: string;
  balance: number | null;
  planTag: PlanTag;
}) {
  const [essayText, setEssayText] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [message, setMessage] = useState("");
  const hasCredits = planTag === "premium" || (balance ?? 0) > 0;

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  function handleCorrection() {
    if (!hasCredits) {
      setMessage(
        "Seus créditos terminaram. Nenhuma correção foi iniciada e seu saldo permanece protegido."
      );
      return;
    }
    if (!essayText.trim() && !fileName) {
      setMessage("Cole sua redação ou envie uma imagem antes de iniciar.");
      return;
    }
    setMessage(
      "Conteúdo preparado. O motor de correção por IA ainda não está conectado e nenhum crédito foi consumido."
    );
  }

  return (
    <Card id="centro-redacao" className={`premium-glow p-5 sm:p-6 lg:p-7 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.20em] text-aura">Centro de Redação</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Corrigir minha redação</h2>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-aura">
          <FileText className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Cole sua redação, envie uma imagem ou suba um arquivo para receber uma análise detalhada.
      </p>

      <textarea
        value={essayText}
        onChange={(event) => setEssayText(event.target.value)}
        placeholder="Cole sua redação aqui..."
        className="mt-6 min-h-64 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-4 py-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-accent/50 focus:shadow-[0_0_28px_rgba(124,58,237,0.16)]"
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm font-semibold text-slate-200 transition hover:border-accent/40 hover:bg-white/[0.07]">
          <Upload className="h-4 w-4" />
          {fileName ?? "Enviar imagem ou arquivo"}
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name)}
          />
        </label>
        <Button disabled={!hasCredits} onClick={handleCorrection} className="min-h-12 flex-1">
          {hasCredits ? "Iniciar correção" : "Sem créditos"}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{wordCount} palavras</span>
        <span>Cada redação corrigida é um erro a menos no dia da prova.</span>
      </div>
      {message && (
        <p className="mt-3 rounded-lg border border-accent/20 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          {message}
        </p>
      )}
      {!hasCredits && !message && (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          Seu saldo chegou a zero. A ferramenta não inicia cobranças nem permite saldo negativo.
        </p>
      )}
    </Card>
  );
}

function RecommendedAction() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">
            Próxima ação recomendada
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
            Descubra onde sua redação perde pontos.
          </h2>
        </div>
        <Route className="h-5 w-5 shrink-0 text-aura" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Envie uma redação hoje e transforme erro invisível em direção objetiva.
      </p>
      <Button
        className="mt-5 w-full"
        onClick={() => document.getElementById("centro-redacao")?.scrollIntoView({ behavior: "smooth" })}
      >
        Corrigir minha redação
        <ArrowDown className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function CreditsCard({ balance, planTag }: { balance: number | null; planTag: PlanTag }) {
  const isEmpty = planTag !== "premium" && balance === 0;

  return (
    <Card className="premium-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Créditos disponíveis
          </p>
          <div className="energy-text mt-2 min-h-16 text-6xl font-semibold text-white">
            {balance === null ? <Loader size="sm" /> : balance}
          </div>
        </div>
        <CreditCard className="h-5 w-5 text-aura" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {isEmpty
          ? "Saldo esgotado. Nenhuma operação poderá gerar saldo negativo."
          : "Use créditos para acessar ferramentas avançadas."}{" "}
        Plano atual: {planTag === "premium" ? "Premium" : "Free"}.
      </p>
    </Card>
  );
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}
