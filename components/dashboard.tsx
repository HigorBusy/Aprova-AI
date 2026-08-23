"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Bot, CheckCircle2, CreditCard, FileText, Target } from "lucide-react";

import { AuthCard } from "@/components/auth-card";
import { Button, Card } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import type { EssayReview } from "@/lib/ai/types";
import { getEnemCountdown } from "@/lib/constants";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlanTag } from "@/lib/types";

type DashboardProps = {
  user: User;
  planTag: PlanTag;
  creditBalance: number | null;
  onCreditBalanceChange: (balance: number) => void;
  onSignOut: () => void;
};

type EssayReviewRow = {
  id: string;
  score: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  theme: string | null;
  review: EssayReview;
  created_at: string;
};

export function Dashboard({
  user,
  planTag,
  creditBalance,
  onCreditBalanceChange,
  onSignOut
}: DashboardProps) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <CountdownPanel className="lg:col-span-12" />
      <NextStepCard className="lg:col-span-12" />

      <WritingCenterCard
        className="lg:col-span-12"
        balance={creditBalance}
        onBalanceChange={onCreditBalanceChange}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:col-span-12">
        <CommanderCard />
        <CreditsCard balance={creditBalance} planTag={planTag} />
      </div>

      <div id="conta" className="scroll-mt-6 lg:col-span-12">
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
  const [countdown, setCountdown] = useState(() => getEnemCountdown());

  useEffect(() => {
    const updateCountdown = () => setCountdown(getEnemCountdown());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const units = [
    { label: "meses", value: countdown.months },
    { label: "semanas", value: countdown.weeks },
    { label: "dias", value: countdown.days },
    { label: "horas", value: countdown.hours }
  ];

  return (
    <Card className={`command-surface relative flex min-h-[360px] overflow-hidden px-4 py-10 text-center sm:min-h-[410px] sm:px-8 sm:py-12 ${className ?? ""}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-[#35bfe7]/70 to-transparent" />
      <div className="relative m-auto w-full max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9de8fb]">Contagem regressiva para o ENEM {PRODUCT_CONFIG.enem.year}</p>
        <div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 place-items-center gap-x-2 gap-y-8 sm:mt-11 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-0">
          {units.map((unit, index) => (
            <div key={unit.label} className={`relative flex w-full min-w-0 flex-col items-center justify-center ${index > 0 ? "lg:before:absolute lg:before:-left-3 lg:before:top-[12%] lg:before:h-[76%] lg:before:w-px lg:before:bg-white/10" : ""}`}>
              <span key={`${unit.label}-${unit.value}`} className="countdown-value font-mono text-6xl font-semibold leading-none text-[#f4f1e8] tabular-nums sm:text-8xl lg:text-9xl">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8fa3b8] sm:text-sm">{unit.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm font-medium text-muted sm:mt-12">Primeiro dia · 8 de novembro · 13h30</p>
      </div>
    </Card>
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
  const [essayTheme, setEssayTheme] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<EssayReview | null>(null);
  const [history, setHistory] = useState<EssayReviewRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const hasCredits = (balance ?? 0) >= PRODUCT_CONFIG.credits.essayReview;
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setHistoryLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (active) setHistoryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("essay_reviews")
        .select("id,score,c1,c2,c3,c4,c5,theme,review,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!active) return;
      if (!error) setHistory((data ?? []) as EssayReviewRow[]);
      setHistoryLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleCorrection() {
    if (!hasCredits) {
      setMessage("Você precisa de 1 crédito para corrigir uma redação.");
      return;
    }
    if (essayText.trim().length < 50) {
      setMessage("Cole uma redação com pelo menos 50 caracteres antes de iniciar.");
      return;
    }
    if (essayTheme.trim().length < 8) {
      setMessage("Informe o tema proposto para a Competência 2 ser avaliada corretamente.");
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
        body: JSON.stringify({ essay: essayText.trim(), theme: essayTheme.trim() })
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

      const completedReview = result.review;
      setReview(completedReview);
      setHistory((current) => [
        {
          id: `local-${Date.now()}`,
          score: completedReview.estimatedScore,
          c1: completedReview.competencies.c1.score,
          c2: completedReview.competencies.c2.score,
          c3: completedReview.competencies.c3.score,
          c4: completedReview.competencies.c4.score,
          c5: completedReview.competencies.c5.score,
          theme: essayTheme.trim(),
          review: completedReview,
          created_at: new Date().toISOString()
        },
        ...current
      ].slice(0, 6));
      if (typeof result.balance === "number") onBalanceChange(result.balance);
      setMessage("Correção concluída. 1 crédito foi consumido.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível corrigir a redação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card id="centro-redacao" className={`border-[#35bfe7]/28 bg-[#0b1829] p-5 sm:p-6 lg:p-8 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Sua redação</h2>
          <p className="mt-2 text-sm font-medium text-aura">Correção pelas cinco competências do ENEM</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#f2c94c] text-[#08111f]">
          <FileText className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Informe o tema e cole sua redação para receber nota estimada, análise das cinco competências e melhorias práticas.
      </p>

      <label className="mt-6 block text-sm font-semibold text-slate-200" htmlFor="essay-theme">
        Tema proposto
      </label>
      <input
        id="essay-theme"
        value={essayTheme}
        onChange={(event) => setEssayTheme(event.target.value)}
        placeholder="Ex: Desafios para a valorização da herança africana no Brasil"
        maxLength={300}
        className="mt-2 min-h-12 w-full rounded-lg border border-[#8fa3b8]/20 bg-[#07101d] px-4 text-sm text-[#e6edf2] outline-none transition placeholder:text-[#60758a] focus:border-[#35bfe7]/65 focus:shadow-[0_0_0_3px_rgba(53,191,231,0.10)]"
      />

      <textarea
        value={essayText}
        onChange={(event) => setEssayText(event.target.value)}
        placeholder="Cole sua redação aqui..."
        maxLength={30_000}
        className="mt-4 min-h-72 w-full resize-y rounded-lg border border-[#8fa3b8]/20 bg-[#07101d] px-5 py-5 text-base leading-7 text-[#e6edf2] outline-none transition placeholder:text-[#60758a] focus:border-[#35bfe7]/65 focus:shadow-[0_0_0_3px_rgba(53,191,231,0.10)]"
      />

      <Button
        disabled={!hasCredits || submitting}
        onClick={() => void handleCorrection()}
        className="mt-3 min-h-12 w-full"
      >
        {submitting ? <Loader size="sm" /> : hasCredits ? "Iniciar correção · 1 crédito" : "Créditos insuficientes"}
      </Button>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{wordCount} palavras</span>
        <span>1 crédito por correção completa</span>
      </div>
      {message && (
        <p className="mt-3 rounded-lg border border-accent/20 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          {message}
        </p>
      )}
      {review && (
        <EssayReviewResult
          review={review}
          onNewEssay={() => {
            setEssayText("");
            setEssayTheme("");
            setReview(null);
            setMessage("");
          }}
          onRewrite={() => {
            setReview(null);
            setMessage("Reescreva abaixo usando a correção como guia. Esta nova correção usará 1 crédito.");
          }}
        />
      )}
      <EssayHistory
        history={history}
        loading={historyLoading}
        onSelect={(selectedReview) => {
          setReview(selectedReview);
          setMessage("Correção do histórico carregada.");
        }}
      />
      {!hasCredits && !message && (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
          É necessário 1 crédito. A ferramenta não inicia cobranças nem permite saldo negativo.
        </p>
      )}
    </Card>
  );
}

function CommanderCard() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-white">
            Orientação para avançar com direção.
          </h2>
          <p className="mt-2 text-xs font-medium text-aura">Tutor IA</p>
        </div>
        <Bot className="h-5 w-5 shrink-0 text-aura" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Tire dúvidas, organize seus estudos e receba orientação personalizada.
      </p>
      <Link
        href="/comandante"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#f2c94c] px-4 py-2 text-sm font-semibold text-[#08111f] transition-colors duration-150 hover:bg-[#f8d866]"
      >
        Abrir Tutor IA
      </Link>
    </Card>
  );
}

type LearningRecommendation = {
  kind: string;
  title: string;
  description: string;
  href: string;
  action: string;
};

function NextStepCard({ className }: { className?: string }) {
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;

    void (async () => {
      const { data } = await supabase.rpc("get_student_learning_profile");
      if (!active || !data) return;
      setRecommendation((data as { recommendation?: LearningRecommendation }).recommendation ?? null);
    })();

    return () => {
      active = false;
    };
  }, []);

  const title = recommendation?.title ?? "Analisando seu próximo passo";
  const description = recommendation?.description ?? "O sistema cruza redações, questões e simulados para escolher uma ação útil.";

  return (
    <Card className={`border-[#8fa3b8]/18 bg-[#0f1e31] ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 text-xs font-medium text-aura">Seu próximo passo</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {recommendation ? <Link href={recommendation.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-4 text-sm font-semibold text-[#08111f] transition-colors duration-150 hover:bg-[#f8d866]">{recommendation.action}<ArrowRight className="h-4 w-4" /></Link> : null}
        </div>
      </div>
    </Card>
  );
}

function EssayReviewResult({
  review,
  onNewEssay,
  onRewrite
}: {
  review: EssayReview;
  onNewEssay: () => void;
  onRewrite: () => void;
}) {
  const [openCompetency, setOpenCompetency] = useState(1);
  const score = review.nota_total ?? review.estimatedScore;
  const classification = classifyEssay(score);
  const competencies = buildCompetencyCards(review);
  const selectedCompetency = competencies.find((competency) => competency.numero === openCompetency) ?? competencies[0];

  return (
    <div className="mt-5 space-y-5 border-t border-[#8fa3b8]/18 pt-6">
      <div className="grid gap-4 rounded-xl bg-[#edf2f4] p-5 text-[#0b1726] sm:grid-cols-[1fr_auto] sm:p-6">
        <div>
          <p className="text-sm font-semibold text-[#05799a]">Resultado da correção</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="font-mono text-6xl font-semibold leading-none tabular-nums sm:text-7xl">{score}</p>
            <p className="pb-2 text-lg font-semibold text-[#607689]">/ 1000</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#607689]">
            Avaliação orientativa por IA baseada nas cinco competências. Não é uma nota oficial do INEP.
          </p>
        </div>
        <div className={`self-start rounded-lg border px-4 py-3 text-center ${classification.className}`}>
          <p className="text-[0.62rem] uppercase tracking-[0.16em] opacity-80">classificação</p>
          <p className="mt-1 text-lg font-semibold">{classification.label}</p>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid grid-cols-[repeat(5,minmax(148px,1fr))] gap-2 overflow-x-auto pb-2">
          {competencies.map((competency) => {
            const active = openCompetency === competency.numero;
            return (
              <button
                key={competency.numero}
                type="button"
                onClick={() => setOpenCompetency(competency.numero)}
                aria-pressed={active}
                className={`group min-h-32 rounded-lg border p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99] ${
                  active
                    ? "border-accent/45 bg-accent/[0.09] shadow-[0_0_34px_rgba(58,167,216,0.16)]"
                    : "border-white/10 bg-white/[0.035] hover:border-accent/30 hover:bg-white/[0.055]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted">
                      Competência {competency.numero}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold leading-5 text-white">{competency.nome}</h3>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${competency.statusClass}`}>
                    {competency.status}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="energy-text text-3xl font-semibold text-white">{competency.nota}/200</p>
                </div>
              </button>
            );
          })}
        </div>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">
                Detalhe técnico
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Competência {selectedCompetency.numero}: {selectedCompetency.nome}
              </h3>
            </div>
            <span className="energy-text shrink-0 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-lg font-semibold text-white">
              {selectedCompetency.nota}
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">{selectedCompetency.descricao}</p>
          <div className="mt-4 border-l-2 border-accent/40 pl-4 sm:pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Leitura do corretor</p>
            <p className="mt-3 max-w-5xl whitespace-pre-line text-sm leading-7 text-slate-200">{selectedCompetency.detalhes}</p>
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-aura">
            <Target className="h-4 w-4" />
            Diagnóstico geral
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{review.diagnostico_geral ?? review.summary}</p>
        </section>
        <section className="rounded-lg border border-accent/25 bg-accent/[0.08] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Próximas ações</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Faça isso antes de enviar sua próxima redação.</h3>
          <Checklist items={review.missao_de_hoje ?? review.improvements} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReviewPanel title="Pontos fortes" items={review.pontos_fortes ?? review.strengths} tone="good" />
        <ReviewPanel title="Pontos fracos" items={review.principais_erros ?? review.weaknesses} tone="warn" />
        <ReviewPanel title="Plano de melhoria" items={review.plano_de_melhoria ?? review.improvements} tone="action" ordered />
      </div>

      {review.trechos_criticos && review.trechos_criticos.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Trechos que custam pontos</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {review.trechos_criticos.map((item, index) => (
              <article key={`${item.trecho}-${index}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <blockquote className="border-l-2 border-accent/50 pl-3 text-sm italic leading-6 text-slate-200">“{item.trecho}”</blockquote>
                <p className="mt-3 text-sm font-semibold text-amber-100">{item.problema}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.impacto}</p>
                <p className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.06] p-3 text-sm leading-6 text-slate-200">{item.melhoria_sugerida}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/comandante?context=${encodeURIComponent(`Quero treinar minha competência mais fraca desta redação: C${selectedCompetency.numero}, ${selectedCompetency.nome}, nota ${selectedCompetency.nota}/200. Use meu histórico e me passe um exercício específico.`)}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#f2c94c] px-4 text-sm font-semibold text-[#08111f] transition-colors duration-150 hover:bg-[#f8d866] sm:col-span-2"
        >
          Treinar esta dificuldade com o Tutor
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Button onClick={onRewrite} className="min-h-12">
          Reescrever com base na correção
        </Button>
        <button
          type="button"
          onClick={onNewEssay}
          className="min-h-12 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-accent/35 hover:text-white"
        >
          Enviar nova redação
        </button>
      </div>
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

function EssayHistory({
  history,
  loading,
  onSelect
}: {
  history: EssayReviewRow[];
  loading: boolean;
  onSelect: (review: EssayReview) => void;
}) {
  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Histórico de Redações</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Últimas correções</h3>
        </div>
        {loading && <Loader size="sm" />}
      </div>
      {!loading && history.length === 0 && (
        <p className="mt-4 text-sm leading-6 text-muted">Seu histórico aparecerá aqui depois da primeira correção.</p>
      )}
      <div className="mt-4 grid gap-3">
        {history.map((item) => {
          const best = bestCompetency(item);
          const worst = worstCompetency(item);
          return (
            <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-xs text-muted">{formatDate(item.created_at)}</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">{item.theme || "Tema não identificado"}</p>
                <p className="mt-1 text-xs text-muted">Melhor: {best} · Pior: {worst}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="energy-text min-w-16 text-right text-2xl font-semibold text-white">{item.score}</span>
                <button
                  type="button"
                  onClick={() => onSelect(normalizeStoredReview(item.review, item))}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-aura transition hover:bg-accent/15"
                >
                  Ver correção
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPanel({
  title,
  items,
  tone,
  ordered = false
}: {
  title: string;
  items: string[];
  tone: "good" | "warn" | "action";
  ordered?: boolean;
}) {
  const toneClass = {
    good: "border-emerald-300/20 bg-emerald-400/[0.05]",
    warn: "border-amber-300/20 bg-amber-400/[0.05]",
    action: "border-accent/25 bg-accent/[0.06]"
  }[tone];

  return (
    <section className={`rounded-lg border p-4 ${toneClass}`}>
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[0.68rem] text-aura">
              {ordered ? index + 1 : <CheckCircle2 className="h-3.5 w-3.5" />}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="mt-4 space-y-2">
      {items.slice(0, 3).map((item, index) => (
        <label key={`${item}-${index}`} className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-black accent-[#9fcf8b]" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function classifyEssay(score: number) {
  if (score >= 900) return { label: "Excelente", className: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" };
  if (score >= 760) return { label: "Boa", className: "border-aura/25 bg-accent/10 text-aura" };
  if (score >= 600) return { label: "Média", className: "border-sky-300/25 bg-sky-400/10 text-sky-100" };
  if (score >= 400) return { label: "Fraca", className: "border-amber-300/25 bg-amber-400/10 text-amber-100" };
  return { label: "Crítica", className: "border-rose-300/25 bg-rose-400/10 text-rose-100" };
}

const competencyInfo = [
  { nome: "Norma padrão", descricao: "Gramática, pontuação, concordância e clareza formal." },
  { nome: "Tema e repertório", descricao: "Compreensão da proposta e uso produtivo de repertório." },
  { nome: "Argumentação", descricao: "Tese, projeto de texto, profundidade e progressão." },
  { nome: "Coesão", descricao: "Conectivos, retomadas e encadeamento textual." },
  { nome: "Intervenção", descricao: "Agente, ação, meio, finalidade e detalhamento." }
];

function buildCompetencyCards(review: EssayReview) {
  const entries = [review.competencies.c1, review.competencies.c2, review.competencies.c3, review.competencies.c4, review.competencies.c5];
  return entries.map((competency, index) => {
    const status = competency.score >= 180 ? "excelente" : competency.score >= 140 ? "bom" : "atenção";
    const statusClass = {
      excelente: "bg-emerald-400/10 text-emerald-100",
      bom: "bg-accent/10 text-aura",
      atenção: "bg-amber-400/10 text-amber-100"
    }[status];
    return {
      numero: index + 1,
      nome: competencyInfo[index].nome,
      descricao: competencyInfo[index].descricao,
      nota: competency.score,
      status,
      statusClass,
      resumo: competency.justificativa || competency.analysis.split(" Problemas:")[0] || "Análise registrada.",
      detalhes: competency.analysis
    };
  });
}

function normalizeStoredReview(review: EssayReview, row: EssayReviewRow): EssayReview {
  return {
    ...review,
    estimatedScore: review.estimatedScore ?? row.score,
    competencies: review.competencies ?? {
      c1: { score: row.c1, analysis: "Histórico salvo." },
      c2: { score: row.c2, analysis: "Histórico salvo." },
      c3: { score: row.c3, analysis: "Histórico salvo." },
      c4: { score: row.c4, analysis: "Histórico salvo." },
      c5: { score: row.c5, analysis: "Histórico salvo." }
    },
    strengths: review.strengths ?? review.pontos_fortes ?? [],
    weaknesses: review.weaknesses ?? review.principais_erros ?? [],
    improvements: review.improvements ?? review.missao_de_hoje ?? [],
    summary: review.summary ?? review.diagnostico_geral ?? "Correção salva no histórico."
  };
}

function bestCompetency(row: EssayReviewRow) {
  return scoreLabel([
    ["C1", row.c1],
    ["C2", row.c2],
    ["C3", row.c3],
    ["C4", row.c4],
    ["C5", row.c5]
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0]);
}

function worstCompetency(row: EssayReviewRow) {
  return scoreLabel([
    ["C1", row.c1],
    ["C2", row.c2],
    ["C3", row.c3],
    ["C4", row.c4],
    ["C5", row.c5]
  ].sort((a, b) => Number(a[1]) - Number(b[1]))[0]);
}

function scoreLabel(entry: (string | number)[]) {
  return `${entry[0]} ${entry[1]}/200`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function CreditsCard({ balance, planTag }: { balance: number | null; planTag: PlanTag }) {
  const isEmpty = balance === 0;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[#8fa3b8]/15 bg-[#0b1829] px-5 py-4">
        <p className="text-sm font-semibold text-[#9de8fb]">Seu saldo</p>
      </div>
      <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="min-h-16 font-mono text-6xl font-semibold text-[#f2c94c] tabular-nums">
            {balance === null ? <Loader size="sm" /> : balance}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-300">créditos disponíveis</p>
        </div>
        <CreditCard className="h-5 w-5 text-aura" />
      </div>
      <div className="mt-5 rounded-lg bg-[#07101d] p-4">
        <p className="text-xl font-semibold text-white">1 crédito = 1 correção</p>
        <p className="mt-1 text-sm leading-6 text-muted">Uma redação completa, avaliada pelas cinco competências.</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
        <span className="rounded-full border border-white/10 px-3 py-1.5">Tutor: 1</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">Arquivo: 2</span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">Plano {formatPlanTag(planTag)}</span>
      </div>
      {isEmpty ? <p className="mt-4 text-sm text-rose-200">Saldo esgotado. Nenhuma operação pode gerar saldo negativo.</p> : null}
      </div>
    </Card>
  );
}

function formatPlanTag(planTag: PlanTag) {
  if (planTag === "ADM") return "ADM";
  return planTag === "premium" ? "Premium" : "Free";
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}
