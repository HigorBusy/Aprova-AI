"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Target, TrendingUp } from "lucide-react";

import { Card, ProgressBar } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import type { QuestionCatalog } from "@/lib/questions";
import { getSupabaseClient } from "@/lib/supabase/client";

type EssayRow = {
  id: string;
  score: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  created_at: string;
};

type WeaknessRow = {
  competency: string;
  weakness_type: string;
  frequency: number;
  severity: number;
  latest_score: number;
  status: "active" | "improving" | "resolved";
};

const competencyNames: Record<string, string> = {
  C1: "Norma padrão",
  C2: "Tema e repertório",
  C3: "Argumentação",
  C4: "Coesão",
  C5: "Intervenção"
};

export function DiagnosticPage() {
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeaknessRow[]>([]);
  const [questionCatalog, setQuestionCatalog] = useState<QuestionCatalog | null>(null);
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
      const userId = sessionData.session?.user.id;
      if (!userId) {
        window.location.assign("/");
        return;
      }

      const [essayResult, weaknessResult, questionResult] = await Promise.all([
        supabase
          .from("essay_reviews")
          .select("id,score,c1,c2,c3,c4,c5,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("user_weaknesses")
          .select("competency,weakness_type,frequency,severity,latest_score,status")
          .eq("user_id", userId)
          .order("severity", { ascending: false })
          .order("frequency", { ascending: false }),
        supabase.rpc("get_question_catalog")
      ]);

      if (!active) return;
      if (essayResult.error || weaknessResult.error || questionResult.error) {
        setError("Não foi possível montar seu diagnóstico agora.");
      } else {
        setEssays((essayResult.data ?? []) as EssayRow[]);
        setWeaknesses((weaknessResult.data ?? []) as WeaknessRow[]);
        setQuestionCatalog(questionResult.data as QuestionCatalog);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => buildMetrics(essays), [essays]);
  const primaryWeakness = weaknesses.find((item) => item.status !== "resolved") ?? null;
  const questionMetrics = useMemo(() => buildQuestionMetrics(questionCatalog), [questionCatalog]);

  if (loading) {
    return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas"><Loader size="lg" /></main>;
  }

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-5 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Sua redação
          </Link>
          <Image src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" width={640} height={220} priority className="h-9 w-auto object-contain" />
        </header>

        <section className="py-8 sm:py-10">
          <p className="text-xs font-medium uppercase tracking-[0.20em] text-aura">Seu diagnóstico de aprendizagem</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Veja o padrão. Corrija o que mais custa pontos.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">Este diagnóstico usa suas redações e respostas salvas. Ele muda conforme você pratica.</p>
        </section>

        {error ? <Card className="border-rose-300/20 text-sm text-rose-100">{error}</Card> : null}

        {!error ? (
          <section className="mb-5 grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Questões respondidas</p>
              <p className="energy-text mt-3 text-4xl font-semibold text-white">{questionMetrics.attempts}</p>
              <p className="mt-2 text-sm text-muted">tentativas registradas</p>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Aproveitamento</p>
              <p className="energy-text mt-3 text-4xl font-semibold text-white">{questionMetrics.accuracy === null ? "—" : `${questionMetrics.accuracy}%`}</p>
              <p className="mt-2 text-sm text-muted">média nas questões</p>
            </Card>
            <Card className="border-accent/20 bg-accent/[0.06]">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Prioridade em questões</p>
              <p className="mt-3 text-xl font-semibold text-white">{questionMetrics.priority?.name ?? "Aguardando evidências"}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{questionMetrics.priority ? `${questionMetrics.priority.accuracy}% de acerto após ${questionMetrics.priority.attempts} tentativas.` : "Responda ao menos duas questões do mesmo assunto."}</p>
              <Link href={questionMetrics.priority ? `/questoes?area=${questionMetrics.priority.areaKey}&topic=${questionMetrics.priority.id}` : "/questoes"} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-aura">
                {questionMetrics.priority ? "Treinar prioridade" : "Iniciar treino"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </section>
        ) : null}

        {!error && essays.length === 0 ? (
          <Card className="premium-glow py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-aura" />
            <h2 className="mt-4 text-2xl font-semibold">Seu diagnóstico começa com a primeira redação.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">Envie um texto para descobrir sua competência mais forte, seu principal gargalo e a próxima ação.</p>
            <Link href="/#centro-redacao" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-[#041014]">
              Enviar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ) : null}

        {!error && essays.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="premium-glow lg:col-span-7">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-aura"><Target className="h-4 w-4" /> Próximo foco</p>
              <h2 className="mt-3 text-3xl font-semibold">{primaryWeakness ? `${primaryWeakness.competency}: ${primaryWeakness.weakness_type}` : "Consolidar o nível atual"}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {primaryWeakness
                  ? `Esse padrão apareceu ${primaryWeakness.frequency} ${primaryWeakness.frequency === 1 ? "vez" : "vezes"} e está em ${primaryWeakness.latest_score}/200. Priorize uma reescrita curta antes da próxima redação completa.`
                  : "Nenhuma fraqueza ativa foi identificada abaixo de 160 pontos. Continue praticando para confirmar consistência."}
              </p>
              <Link href="/#centro-redacao" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-[#041014]">
                Enviar nova redação <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="lg:col-span-5">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-aura"><TrendingUp className="h-4 w-4" /> Evolução</p>
              <p className="energy-text mt-4 text-5xl font-semibold">{metrics.latestScore}</p>
              <p className="mt-2 text-sm text-muted">última nota estimada</p>
              <p className="mt-5 text-sm leading-6 text-slate-300">{metrics.trendLabel}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Metric label="média" value={metrics.averageScore.toString()} />
                <Metric label="redações" value={essays.length.toString()} />
              </div>
            </Card>

            <Card className="lg:col-span-12">
              <h2 className="text-2xl font-semibold">Desempenho por competência</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {metrics.competencies.map((item) => (
                  <div key={item.key} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs text-aura">{item.key}</p><p className="mt-1 text-sm font-semibold">{item.name}</p></div>
                      <span className="energy-text text-xl font-semibold">{item.score}</span>
                    </div>
                    <ProgressBar value={(item.score / 200) * 100} className="mt-4" />
                    <p className="mt-3 text-xs leading-5 text-muted">{competencyStage(item.score)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-12">
              <h2 className="text-2xl font-semibold">Padrões acompanhados</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {weaknesses.length === 0 ? <p className="text-sm text-muted">Ainda não há repetição suficiente para apontar um padrão.</p> : weaknesses.map((item) => (
                  <div key={item.competency} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-4">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.status === "resolved" ? "text-emerald-300" : "text-aura"}`} />
                    <div><p className="font-semibold">{item.competency}: {item.weakness_type}</p><p className="mt-1 text-sm leading-6 text-muted">{item.frequency} ocorrências · {item.latest_score}/200 · {statusLabel(item.status)}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function buildMetrics(essays: EssayRow[]) {
  const latest = essays[0];
  const oldest = essays[essays.length - 1];
  const averageScore = essays.length ? Math.round(essays.reduce((sum, item) => sum + item.score, 0) / essays.length) : 0;
  const delta = latest && oldest ? latest.score - oldest.score : 0;
  const trendLabel = essays.length < 2
    ? "Esta é sua linha de base. A próxima redação mostrará a tendência."
    : delta > 0
      ? `Você avançou ${delta} pontos desde a primeira correção deste recorte.`
      : delta < 0
        ? `Sua última nota ficou ${Math.abs(delta)} pontos abaixo da primeira deste recorte. Revise o foco antes de repetir o texto completo.`
        : "Sua nota está estável. O próximo ganho depende de atacar a competência mais fraca.";
  const keys = ["C1", "C2", "C3", "C4", "C5"] as const;
  const competencies = keys.map((key) => ({
    key,
    name: competencyNames[key],
    score: latest ? latest[key.toLowerCase() as "c1" | "c2" | "c3" | "c4" | "c5"] : 0
  }));
  return { latestScore: latest?.score ?? 0, averageScore, trendLabel, competencies };
}

function buildQuestionMetrics(catalog: QuestionCatalog | null) {
  const topics = catalog?.topics ?? [];
  const attempts = topics.reduce((sum, topic) => sum + topic.attempts, 0);
  const correct = topics.reduce((sum, topic) => sum + topic.correct, 0);
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : null;
  const priority = [...topics]
    .filter((topic) => topic.attempts >= 2)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || b.attempts - a.attempts)[0] ?? null;

  return { attempts, accuracy, priority };
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/25 p-3"><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function competencyStage(score: number) {
  if (score >= 180) return "Forte";
  if (score >= 160) return "Estável";
  if (score >= 120) return "Em evolução";
  return "Crítica";
}

function statusLabel(status: WeaknessRow["status"]) {
  if (status === "resolved") return "padrão superado";
  if (status === "improving") return "em melhora";
  return "foco ativo";
}
