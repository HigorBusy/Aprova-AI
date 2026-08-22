"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, FileText, Gauge, Target, TrendingDown, TrendingUp } from "lucide-react";

import { Card, ProgressBar } from "@/components/ui";
import { InternalNav } from "@/components/internal-nav";
import { Loader } from "@/components/ui/loader-15";
import { questionAreaLabel, type QuestionAreaKey } from "@/lib/questions";
import { getSupabaseClient } from "@/lib/supabase/client";

type Recommendation = { title: string; description: string; href: string; action: string; kind: string };
type AreaEvidence = { areaKey: QuestionAreaKey; attempts: number; correct: number; accuracy: number | null };
type EssayHistory = { id: string; score: number; c1: number; c2: number; c3: number; c4: number; c5: number; theme: string | null; createdAt: string };
type SimulationHistory = { sessionId: string; questionCount: number; answered: number; correct: number; accuracy: number; startedAt: string; completedAt: string; durationSeconds: number };
type ActivityDay = { dateKey: string; studiedMinutes: number; tasksCompleted: number; questionsAnswered: number };
type Period = { attempts: number; correct: number; accuracy: number | null };

type EvolutionData = {
  generatedAt: string;
  profile: {
    evidence: { essayCount: number; questionAttempts: number; simulationCount: number };
    essay: { averageScore: number | null; bestScore: number | null; latestScore: number | null };
    questions: { attempts: number; correct: number; accuracy: number | null; areas: AreaEvidence[] };
    simulations: { count: number; latest: { accuracy: number; completedAt: string } | null };
    recommendation: Recommendation;
  };
  comparison: { current7Days: Period; previous7Days: Period };
  activity: ActivityDay[];
  activeDays28: number;
  essayHistory: EssayHistory[];
  simulationHistory: SimulationHistory[];
};

export function DiagnosticPage() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("A conexão com sua conta não está configurada.");
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        window.location.assign("/");
        return;
      }
      const { data: evolution, error: evolutionError } = await supabase.rpc("get_evolution_dashboard");
      if (!active) return;
      if (evolutionError || !evolution) setError("Não foi possível montar sua evolução agora.");
      else {
        setData(evolution as EvolutionData);
        void supabase.rpc("track_product_event", { p_event_name: "evolution_viewed", p_properties: {} });
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas"><Loader size="lg" /></main>;

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-5 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Sua redação</Link>
          <Image src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" width={640} height={220} priority className="h-9 w-auto object-contain" />
        </header>
        <InternalNav active="evolution" />
        <section className="py-8 sm:py-10"><p className="text-xs font-medium uppercase tracking-[0.20em] text-aura">Evidência de evolução</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">O que mudou. E o que ainda exige trabalho.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted">Redações, questões e simulados reunidos em um diagnóstico que muda com a sua prática.</p></section>
        {error ? <Card className="border-rose-300/20 text-sm text-rose-100">{error}</Card> : null}
        {data ? <EvolutionContent data={data} /> : null}
      </div>
    </main>
  );
}

function EvolutionContent({ data }: { data: EvolutionData }) {
  const profile = data.profile;
  const essayDelta = useMemo(() => data.essayHistory.length < 2 ? null : data.essayHistory[0].score - data.essayHistory[data.essayHistory.length - 1].score, [data.essayHistory]);
  const current = data.comparison.current7Days;
  const previous = data.comparison.previous7Days;
  const accuracyDelta = current.accuracy !== null && previous.accuracy !== null ? current.accuracy - previous.accuracy : null;

  return (
    <div className="grid gap-5">
      <Card className="command-surface premium-glow border-accent/25 p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-aura"><Target className="h-4 w-4" /> Próximo passo</p><h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{profile.recommendation.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{profile.recommendation.description}</p></div><Link href={profile.recommendation.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent px-5 text-sm font-semibold text-[#041014] shadow-[0_0_30px_rgba(159,207,139,0.16)] transition-transform duration-150 active:scale-[0.97]">{profile.recommendation.action}<ArrowRight className="h-4 w-4" /></Link></div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileText} label="Última redação" value={profile.essay.latestScore === null ? "—" : String(profile.essay.latestScore)} detail={essayDelta === null ? "Aguardando comparação" : `${essayDelta >= 0 ? "+" : ""}${essayDelta} pontos no recorte`} />
        <MetricCard icon={Gauge} label="Questões" value={profile.questions.accuracy === null ? "—" : `${profile.questions.accuracy}%`} detail={`${profile.questions.attempts} respostas registradas`} />
        <MetricCard icon={CheckCircle2} label="Simulados" value={String(profile.simulations.count)} detail={profile.simulations.latest ? `Último: ${profile.simulations.latest.accuracy}%` : "Nenhum concluído"} />
        <MetricCard icon={CalendarDays} label="Consistência" value={`${data.activeDays28}/28`} detail="dias com atividade no último ciclo" />
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura">Últimos 7 dias</p><h2 className="mt-2 text-2xl font-semibold">Ritmo recente</h2></div>{accuracyDelta !== null ? <TrendBadge value={accuracyDelta} /> : null}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><PeriodCard label="Período atual" period={current} /><PeriodCard label="7 dias anteriores" period={previous} /></div>
          <div className="mt-6"><p className="text-xs uppercase tracking-[0.14em] text-muted">Atividade nos últimos 28 dias</p><ActivityGrid activity={data.activity} /></div>
        </Card>

        <Card className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura">Desempenho por área</p><h2 className="mt-2 text-2xl font-semibold">Onde a base está cedendo</h2>
          <div className="mt-5 grid gap-4">{profile.questions.areas.length ? profile.questions.areas.map((area) => <div key={area.areaKey}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{questionAreaLabel(area.areaKey)}</span><span className="text-muted">{area.accuracy ?? 0}% · {area.attempts} respostas</span></div><ProgressBar value={area.accuracy ?? 0} className="mt-2" /></div>) : <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm leading-6 text-muted">Responda questões para revelar o desempenho por área.</p>}</div>
          <Link href="/questoes" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-aura">Abrir treino de questões <ArrowRight className="h-4 w-4" /></Link>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2"><EssayHistoryCard essays={data.essayHistory} /><SimulationHistoryCard simulations={data.simulationHistory} /></section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) { return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="energy-text mt-3 text-4xl font-semibold">{value}</p></div><Icon className="h-5 w-5 text-aura" /></div><p className="mt-3 text-sm text-muted">{detail}</p></Card>; }
function PeriodCard({ label, period }: { label: string; period: Period }) { return <div className="rounded-lg border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="mt-3 text-3xl font-semibold">{period.accuracy === null ? "—" : `${period.accuracy}%`}</p><p className="mt-2 text-sm text-muted">{period.correct} acertos em {period.attempts} respostas</p></div>; }
function TrendBadge({ value }: { value: number }) { const positive = value >= 0; return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${positive ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100" : "border-rose-300/20 bg-rose-300/[0.07] text-rose-100"}`}>{positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{positive ? "+" : ""}{value} p.p.</span>; }

function ActivityGrid({ activity }: { activity: ActivityDay[] }) {
  const values = new Map(activity.map((item) => [item.dateKey, item.studiedMinutes + item.tasksCompleted * 10 + item.questionsAnswered * 4]));
  const days = Array.from({ length: 28 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (27 - index)); return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); });
  return <div className="mt-3 grid grid-cols-14 gap-1.5 sm:grid-cols-28">{days.map((day) => { const value = values.get(day) ?? 0; const tone = value === 0 ? "bg-white/[0.035]" : value < 10 ? "bg-aura/20" : value < 30 ? "bg-aura/45" : "bg-accent/75"; return <span key={day} title={`${day}: ${value ? "atividade registrada" : "sem atividade"}`} className={`aspect-square rounded-[3px] border border-white/[0.05] ${tone}`} />; })}</div>;
}

function EssayHistoryCard({ essays }: { essays: EssayHistory[] }) {
  const latest = essays[0];
  return <Card><p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura">Histórico de redação</p><h2 className="mt-2 text-2xl font-semibold">Notas e competências</h2>{latest ? <><div className="mt-5 flex items-end justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4"><div><p className="text-xs text-muted">Correção mais recente</p><p className="mt-2 text-4xl font-semibold">{latest.score}</p></div><p className="max-w-56 text-right text-sm leading-6 text-muted">{latest.theme ?? "Tema não informado"}</p></div><div className="mt-4 grid grid-cols-5 gap-2">{[latest.c1, latest.c2, latest.c3, latest.c4, latest.c5].map((score, index) => <div key={index} className="rounded-lg border border-white/10 bg-white/[0.025] p-2 text-center"><p className="text-[0.65rem] text-muted">C{index + 1}</p><p className="mt-1 text-lg font-semibold">{score}</p></div>)}</div><div className="mt-4 flex h-28 items-end gap-2">{[...essays].reverse().map((essay) => <div key={essay.id} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[0.65rem] text-muted opacity-0 transition-opacity group-hover:opacity-100">{essay.score}</span><span className="w-full rounded-t bg-gradient-to-t from-aura/35 to-accent/70" style={{ height: `${Math.max(10, essay.score / 10)}%` }} /></div>)}</div></> : <EmptyState text="Sua primeira correção cria a linha de base da redação." href="/#centro-redacao" action="Enviar redação" />}</Card>;
}

function SimulationHistoryCard({ simulations }: { simulations: SimulationHistory[] }) { return <Card><p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura">Histórico de simulados</p><h2 className="mt-2 text-2xl font-semibold">Desempenho sob tempo</h2>{simulations.length ? <div className="mt-5 grid gap-3">{simulations.slice(0, 6).map((simulation, index) => <Link href="/simulado" key={simulation.sessionId} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-accent/30"><div><p className="text-sm font-semibold">{index === 0 ? "Último simulado" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(simulation.completedAt))}</p><p className="mt-1 text-xs text-muted">{simulation.correct}/{simulation.answered} corretas · {Math.floor(simulation.durationSeconds / 60)} min</p></div><span className="text-2xl font-semibold text-aura">{simulation.accuracy}%</span></Link>)}</div> : <EmptyState text="Faça um simulado para medir velocidade e resistência." href="/simulado" action="Configurar simulado" />}</Card>; }
function EmptyState({ text, href, action }: { text: string; href: string; action: string }) { return <div className="mt-5 rounded-lg border border-dashed border-white/10 p-5 text-sm text-muted"><p>{text}</p><Link href={href} className="mt-4 inline-flex min-h-10 items-center gap-2 font-semibold text-aura">{action}<ArrowRight className="h-4 w-4" /></Link></div>; }
