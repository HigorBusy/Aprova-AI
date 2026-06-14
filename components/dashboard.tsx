"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Bot, CreditCard, FileText, Radar } from "lucide-react";

import { AuthCard } from "@/components/auth-card";
import { Button, Card, Stat } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import type { EssayReview } from "@/lib/ai/types";
import { getDaysToEnem, getEnemCountdown } from "@/lib/constants";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlanTag, StudyState } from "@/lib/types";

type DashboardProps = {
  state: StudyState;
  user: User;
  planTag: PlanTag;
  creditBalance: number | null;
  onCreditBalanceChange: (balance: number) => void;
  onSignOut: () => void;
};

const flightBars = [18, 22, 28, 34, 42, 56, 68, 76, 72, 84, 66, 58, 49, 40, 31, 24];

export function Dashboard({
  state,
  user,
  planTag,
  creditBalance,
  onCreditBalanceChange,
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
        onBalanceChange={onCreditBalanceChange}
      />

      <div className="grid content-start gap-4 lg:col-span-4">
        <CommanderCard />
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
  onBalanceChange
}: {
  className?: string;
  balance: number | null;
  onBalanceChange: (balance: number) => void;
}) {
  const [essayText, setEssayText] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<EssayReview | null>(null);
  const hasCredits = (balance ?? 0) >= 5;
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  async function handleCorrection() {
    if (!hasCredits) {
      setMessage("Você precisa de 5 créditos para corrigir uma redação.");
      return;
    }
    if (essayText.trim().length < 50) {
      setMessage("Cole uma redação com pelo menos 50 caracteres antes de iniciar.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;
    setSubmitting(true);
    setMessage("");
    setReview(null);

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

      const response = await fetch("/api/essay-review", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ essay: essayText.trim() })
      });
      const result = (await response.json()) as {
        review?: EssayReview;
        balance?: number;
        error?: string;
      };

      if (!response.ok || !result.review) {
        if (typeof result.balance === "number") onBalanceChange(result.balance);
        throw new Error(result.error || "Não foi possível corrigir a redação.");
      }

      setReview(result.review);
      if (typeof result.balance === "number") onBalanceChange(result.balance);
      setMessage("Correção concluída. Cinco créditos foram consumidos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível corrigir a redação.");
    } finally {
      setSubmitting(false);
    }
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
        Cole sua redação para receber nota estimada, análise das cinco competências e melhorias práticas.
      </p>

      <textarea
        value={essayText}
        onChange={(event) => setEssayText(event.target.value)}
        placeholder="Cole sua redação aqui..."
        maxLength={30_000}
        className="mt-6 min-h-64 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-4 py-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-accent/50 focus:shadow-[0_0_28px_rgba(124,58,237,0.16)]"
      />

      <Button
        disabled={!hasCredits || submitting}
        onClick={() => void handleCorrection()}
        className="mt-3 min-h-12 w-full"
      >
        {submitting ? <Loader size="sm" /> : hasCredits ? "Iniciar correção · 5 créditos" : "Créditos insuficientes"}
      </Button>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{wordCount} palavras</span>
        <span>Cada redação corrigida é um erro a menos no dia da prova.</span>
      </div>
      {message && (
        <p className="mt-3 rounded-lg border border-accent/20 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          {message}
        </p>
      )}
      {review && <EssayReviewResult review={review} />}
      {!hasCredits && !message && (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          São necessários 5 créditos. A ferramenta não inicia cobranças nem permite saldo negativo.
        </p>
      )}
    </Card>
  );
}

function CommanderCard() {
  return (
    <Card className="premium-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Comandante IA</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
            Orientação para avançar com direção.
          </h2>
        </div>
        <Bot className="h-5 w-5 shrink-0 text-aura" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Tire dúvidas, organize seus estudos e receba orientação personalizada.
      </p>
      <Link
        href="/comandante"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-accent/30 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_0_34px_rgba(124,58,237,0.30)] transition hover:bg-violet"
      >
        Abrir Comandante
      </Link>
    </Card>
  );
}

function EssayReviewResult({ review }: { review: EssayReview }) {
  const competencies = Object.entries(review.competencies);

  return (
    <div className="mt-5 rounded-lg border border-accent/25 bg-black/35 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Nota estimada</p>
          <p className="energy-text mt-1 text-5xl font-semibold text-white">{review.estimatedScore}</p>
        </div>
        <p className="pb-1 text-sm text-muted">de 1000 pontos</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {competencies.map(([key, competency], index) => (
          <div key={key} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">Competência {index + 1}</p>
              <span className="text-sm text-aura">{competency.score}/200</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{competency.analysis}</p>
          </div>
        ))}
      </div>
      <ReviewList title="Pontos fortes" items={review.strengths} />
      <ReviewList title="Pontos fracos" items={review.weaknesses} />
      <ReviewList title="Próximas melhorias" items={review.improvements} />
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
        {items.map((item, index) => <li key={`${title}-${index}`}>• {item}</li>)}
      </ul>
    </div>
  );
}

function CreditsCard({ balance, planTag }: { balance: number | null; planTag: PlanTag }) {
  const isEmpty = balance === 0;

  return (
    <Card className="premium-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Créditos disponíveis</p>
          <div className="energy-text mt-2 min-h-16 text-6xl font-semibold text-white">
            {balance === null ? <Loader size="sm" /> : balance}
          </div>
        </div>
        <CreditCard className="h-5 w-5 text-aura" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        {isEmpty
          ? "Saldo esgotado. Nenhuma operação poderá gerar saldo negativo."
          : "Cada pergunta usa 1 crédito e cada correção de redação usa 5."}{" "}
        Plano atual: {planTag === "premium" ? "Premium" : "Free"}.
      </p>
    </Card>
  );
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}
