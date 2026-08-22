"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Flag,
  RotateCcw,
  Target,
  X
} from "lucide-react";

import { Button, Card, GhostButton } from "@/components/ui";
import { InternalNav } from "@/components/internal-nav";
import { Loader } from "@/components/ui/loader-15";
import {
  difficultyLabel,
  questionAreaLabel,
  questionAreas,
  type QuestionAnswerResult,
  type QuestionAreaKey,
  type QuestionCatalog,
  type QuestionErrorEntry,
  type QuestionMode,
  type QuestionOption,
  type QuestionSession,
  type QuestionSessionSummary,
  type TrainingQuestion
} from "@/lib/questions";
import { getSupabaseClient } from "@/lib/supabase/client";

type QuestionCenterProps = {
  initialArea?: QuestionAreaKey;
  initialTopicId?: string;
};

type Screen = "home" | "training" | "result" | "errors";

export function QuestionCenter({ initialArea, initialTopicId }: QuestionCenterProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [catalog, setCatalog] = useState<QuestionCatalog | null>(null);
  const [session, setSession] = useState<QuestionSession | null>(null);
  const [summary, setSummary] = useState<QuestionSessionSummary | null>(null);
  const [errors, setErrors] = useState<QuestionErrorEntry[]>([]);
  const [selectedArea, setSelectedArea] = useState<QuestionAreaKey>(initialArea ?? "math");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace("/");
      return;
    }

    let active = true;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.replace("/");
        return;
      }

      const [{ data: catalogData, error: catalogError }, { data: activeSession }] = await Promise.all([
        supabase.rpc("get_question_catalog"),
        supabase.rpc("get_active_question_session")
      ]);
      if (!active) return;

      if (catalogError || !catalogData) {
        setMessage("Não foi possível carregar o Centro de Questões.");
      } else {
        setCatalog(catalogData as QuestionCatalog);
      }

      if (activeSession) {
        const restored = activeSession as QuestionSession;
        setSession(restored);
        setCurrentIndex(firstPendingIndex(restored));
        setScreen("training");
      } else if (initialTopicId) {
        await startTraining("area", initialArea, initialTopicId);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // The initial route filters are intentionally read only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const answeredCount = session?.questions.filter((question) => question.selectedOption).length ?? 0;
  const totalAttempts = catalog?.topics.reduce((total, topic) => total + topic.attempts, 0) ?? 0;
  const totalCorrect = catalog?.topics.reduce((total, topic) => total + topic.correct, 0) ?? 0;
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
  const priorityTopic = useMemo(
    () => [...(catalog?.topics ?? [])]
      .filter((topic) => topic.attempts >= 2)
      .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || b.attempts - a.attempts)[0] ?? null,
    [catalog]
  );

  useEffect(() => {
    setSelectedOption(currentQuestion?.selectedOption ?? null);
  }, [currentQuestion?.id, currentQuestion?.selectedOption]);

  async function refreshCatalog() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.rpc("get_question_catalog");
    if (data) setCatalog(data as QuestionCatalog);
  }

  async function startTraining(mode: QuestionMode, area?: QuestionAreaKey, topicId?: string) {
    const supabase = getSupabaseClient();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage("");
    setSummary(null);
    setConfirmIncomplete(false);

    const { data, error } = await supabase.rpc("start_question_session", {
      p_mode: mode,
      p_area_key: area ?? null,
      p_topic_id: topicId ?? null,
      p_count: topicId ? 1 : 5
    });
    if (error || !data) {
      setMessage(mode === "errors"
        ? "Seu caderno ainda não possui questões disponíveis para refazer."
        : "Não foi possível iniciar este treino agora.");
      setBusy(false);
      return;
    }

    const nextSession = data as QuestionSession;
    setSession(nextSession);
    setCurrentIndex(0);
    setSelectedOption(nextSession.questions[0]?.selectedOption ?? null);
    setScreen("training");
    setBusy(false);
  }

  async function submitAnswer() {
    const supabase = getSupabaseClient();
    if (!supabase || !session || !currentQuestion || !selectedOption || currentQuestion.result || busy) return;
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.rpc("submit_question_answer", {
      p_session_id: session.id,
      p_question_id: currentQuestion.id,
      p_selected_option: selectedOption
    });
    if (error || !data) {
      setMessage("Não foi possível registrar sua resposta. Tente novamente.");
      setBusy(false);
      return;
    }

    const result = data as QuestionAnswerResult;
    setSession((current) => current ? {
      ...current,
      questions: current.questions.map((question) => question.id === currentQuestion.id
        ? { ...question, selectedOption, answeredAt: new Date().toISOString(), result }
        : question)
    } : current);
    setBusy(false);
  }

  async function toggleReview() {
    const supabase = getSupabaseClient();
    if (!supabase || !session || !currentQuestion || busy) return;
    const nextMarked = !currentQuestion.markedReview;
    setBusy(true);
    const { error } = await supabase.rpc("set_question_review", {
      p_session_id: session.id,
      p_question_id: currentQuestion.id,
      p_marked: nextMarked
    });
    if (!error) {
      setSession((current) => current ? {
        ...current,
        questions: current.questions.map((question) => question.id === currentQuestion.id
          ? { ...question, markedReview: nextMarked }
          : question)
      } : current);
    }
    setBusy(false);
  }

  async function finishTraining(force = false) {
    const supabase = getSupabaseClient();
    if (!supabase || !session || busy) return;
    const blank = session.questions.filter((question) => !question.selectedOption).length;
    if (blank > 0 && !force) {
      setConfirmIncomplete(true);
      setMessage(`Ainda existem ${blank} ${blank === 1 ? "questão sem resposta" : "questões sem resposta"}.`);
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.rpc("complete_question_session", { p_session_id: session.id });
    if (error || !data) {
      setMessage("Não foi possível finalizar o treino.");
      setBusy(false);
      return;
    }
    setSummary(data as QuestionSessionSummary);
    setSession((current) => current ? { ...current, status: "completed" } : current);
    setScreen("result");
    setConfirmIncomplete(false);
    await refreshCatalog();
    setBusy(false);
  }

  async function openErrors() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("get_question_error_notebook", { p_limit: 40 });
    if (error) setMessage("Não foi possível carregar seu caderno de erros.");
    else setErrors((data ?? []) as QuestionErrorEntry[]);
    setScreen("errors");
    setBusy(false);
  }

  function goToQuestion(index: number) {
    if (!session) return;
    const bounded = Math.max(0, Math.min(index, session.questions.length - 1));
    setCurrentIndex(bounded);
    setConfirmIncomplete(false);
    setMessage("");
  }

  if (loading) {
    return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas"><Loader size="lg" /></main>;
  }

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas pb-24 text-white lg:pb-6 lg:pl-64">
      <InternalNav active="questions" />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <QuestionHeader screen={screen} onHome={() => { setScreen("home"); setMessage(""); void refreshCatalog(); }} />

        {screen === "home" && catalog ? (
          <QuestionHome
            catalog={catalog}
            selectedArea={selectedArea}
            totalAttempts={totalAttempts}
            overallAccuracy={overallAccuracy}
            priorityTopic={priorityTopic}
            busy={busy}
            onAreaChange={setSelectedArea}
            onStart={startTraining}
            onErrors={() => void openErrors()}
          />
        ) : null}

        {screen === "training" && session && currentQuestion ? (
          <TrainingView
            session={session}
            question={currentQuestion}
            currentIndex={currentIndex}
            answeredCount={answeredCount}
            selectedOption={selectedOption}
            busy={busy}
            confirmIncomplete={confirmIncomplete}
            onSelect={setSelectedOption}
            onSubmit={() => void submitAnswer()}
            onToggleReview={() => void toggleReview()}
            onPrevious={() => goToQuestion(currentIndex - 1)}
            onNext={() => goToQuestion(currentIndex + 1)}
            onJump={goToQuestion}
            onFinish={(force) => void finishTraining(force)}
          />
        ) : null}

        {screen === "result" && summary ? (
          <ResultView
            summary={summary}
            onHome={() => { setScreen("home"); setSession(null); setMessage(""); }}
            onRetryErrors={() => void startTraining("errors")}
          />
        ) : null}

        {screen === "errors" ? (
          <ErrorNotebook entries={errors} busy={busy} onRetry={() => void startTraining("errors")} />
        ) : null}

        {message ? (
          <p className="mx-auto mt-4 max-w-4xl rounded-lg border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-50">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function QuestionHeader({ screen, onHome }: { screen: Screen; onHome: () => void }) {
  return (
      <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {screen !== "home" ? (
          <button type="button" onClick={onHome} aria-label="Voltar para Questões" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-accent/35 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Treino por evidência</p>
          <h1 className="mt-1 truncate text-2xl font-semibold text-white">Questões</h1>
        </div>
      </div>
      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2 text-xs font-semibold text-emerald-100">
        Treino sem créditos
      </span>
      </header>
  );
}

function QuestionHome({ catalog, selectedArea, totalAttempts, overallAccuracy, priorityTopic, busy, onAreaChange, onStart, onErrors }: {
  catalog: QuestionCatalog;
  selectedArea: QuestionAreaKey;
  totalAttempts: number;
  overallAccuracy: number | null;
  priorityTopic: QuestionCatalog["topics"][number] | null;
  busy: boolean;
  onAreaChange: (area: QuestionAreaKey) => void;
  onStart: (mode: QuestionMode, area?: QuestionAreaKey, topicId?: string) => Promise<void>;
  onErrors: () => void;
}) {
  const areaTopics = catalog.topics.filter((topic) => topic.areaKey === selectedArea);

  return (
    <div className="mt-6 grid gap-4">
      <section className="command-surface premium-glow grid gap-5 rounded-xl border border-accent/20 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura">Treino rápido</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">Treine questões com direção.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Responda, entenda o erro e use o resultado para decidir o próximo assunto.</p>
        </div>
        <Button disabled={busy} onClick={() => void onStart("quick")} className="min-h-12 px-6">
          {busy ? <Loader size="sm" /> : <><Target className="h-4 w-4" /> Iniciar treino rápido</>}
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Questões respondidas" value={String(totalAttempts)} />
        <Metric label="Taxa de acerto" value={overallAccuracy === null ? "—" : `${overallAccuracy}%`} />
        <Metric label="Questões no caderno" value={String(catalog.errorCount)} />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Treino por área</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Escolha o foco.</h2>
            </div>
            <p className="text-sm text-muted">5 questões por treino</p>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {questionAreas.map((area) => (
              <button key={area.key} type="button" onClick={() => onAreaChange(area.key)} className={`min-h-20 rounded-lg border p-3 text-left transition ${selectedArea === area.key ? "border-accent/45 bg-accent/[0.10] text-white" : "border-white/10 bg-black/20 text-slate-400 hover:border-accent/25 hover:text-white"}`}>
                <span className="text-sm font-semibold">{area.shortLabel}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{area.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.08] pt-5">
            {areaTopics.map((topic) => (
              <button key={topic.id} type="button" disabled={busy} onClick={() => void onStart("area", selectedArea, topic.id)} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-accent/35 hover:text-white">
                {topic.name}{topic.accuracy !== null ? ` · ${topic.accuracy}%` : ""}
              </button>
            ))}
          </div>
          <Button disabled={busy} onClick={() => void onStart("area", selectedArea)} className="mt-5 min-h-11 w-full px-5 sm:w-auto">
            Treinar {questionAreaLabel(selectedArea)} <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        <aside className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/[0.08] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Outros modos</p>
          </div>
          <QuestionAction icon={AlarmClock} title="Simulado" description="Tempo e resultado por área" href="/simulado" />
          <QuestionAction icon={Brain} title="Treinar prioridade" description={priorityTopic ? `${priorityTopic.name} · ${priorityTopic.accuracy}%` : "Disponível após mais respostas"} disabled={!priorityTopic || busy} onClick={() => void onStart("weakness")} />
          <QuestionAction icon={BookOpenCheck} title="Refazer erros" description={catalog.errorCount ? `${catalog.errorCount} no caderno` : "Nenhum erro registrado"} disabled={catalog.errorCount === 0 || busy} onClick={() => void onStart("errors")} />
          <QuestionAction icon={AlertCircle} title="Caderno de erros" description="Explicações e padrões" disabled={catalog.errorCount === 0 || busy} onClick={onErrors} />
        </aside>
      </div>
    </div>
  );
}

function QuestionAction({ icon: Icon, title, description, href, disabled = false, onClick }: {
  icon: typeof Target;
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const content = <><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-aura"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{title}</span><span className="mt-1 block truncate text-xs text-muted">{description}</span></span><ChevronRight className="h-4 w-4 text-slate-600" /></>;
  const className = "flex min-h-20 w-full items-center gap-3 border-b border-white/[0.08] px-4 text-left transition last:border-b-0 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return href ? <Link href={href} className={className}>{content}</Link> : <button type="button" disabled={disabled} onClick={onClick} className={className}>{content}</button>;
}

function TrainingView({ session, question, currentIndex, answeredCount, selectedOption, busy, confirmIncomplete, onSelect, onSubmit, onToggleReview, onPrevious, onNext, onJump, onFinish }: {
  session: QuestionSession;
  question: TrainingQuestion;
  currentIndex: number;
  answeredCount: number;
  selectedOption: QuestionOption | null;
  busy: boolean;
  confirmIncomplete: boolean;
  onSelect: (option: QuestionOption) => void;
  onSubmit: () => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onFinish: (force: boolean) => void;
}) {
  const result = question.result;
  const lastQuestion = currentIndex === session.questions.length - 1;
  const tutorContext = buildTutorContext(question);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-1.5 font-semibold text-aura">Questão {currentIndex + 1} de {session.questions.length}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300">{questionAreaLabel(question.areaKey)}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-400">{difficultyLabel(question.difficulty)}</span>
          </div>
          <button type="button" onClick={onToggleReview} disabled={busy} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${question.markedReview ? "border-amber-300/35 bg-amber-300/[0.10] text-amber-100" : "border-white/10 text-slate-400 hover:text-white"}`}>
            <Flag className="h-3.5 w-3.5" /> {question.markedReview ? "Marcada" : "Revisar depois"}
          </button>
        </div>

        <div className="py-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{question.discipline} · {question.topic}</p>
          <h2 className="mt-4 whitespace-pre-line text-lg font-medium leading-8 text-white sm:text-xl">{question.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {question.alternatives.map((alternative) => {
              const state = optionState(alternative.key, selectedOption, result);
              return (
                <button key={alternative.key} type="button" disabled={Boolean(result) || busy} onClick={() => onSelect(alternative.key)} className={`flex min-h-14 items-start gap-3 rounded-xl border p-3 text-left transition sm:p-4 ${state.className}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-semibold ${state.keyClassName}`}>{state.icon ?? alternative.key}</span>
                  <span className="pt-1 text-sm leading-6 sm:text-base">{alternative.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {result ? (
          <section className={`rounded-xl border p-4 sm:p-5 ${result.isCorrect ? "border-emerald-300/25 bg-emerald-300/[0.07]" : "border-rose-300/25 bg-rose-300/[0.07]"}`}>
            <div className="flex items-center gap-2">
              {result.isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : <AlertCircle className="h-5 w-5 text-rose-200" />}
              <h3 className="font-semibold text-white">{result.isCorrect ? "Resposta correta" : `Resposta correta: ${result.correctOption}`}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{result.explanation}</p>
            <Link href={`/comandante?context=${encodeURIComponent(tutorContext)}`} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white hover:border-accent/35">
              <CircleHelp className="h-4 w-4 text-aura" /> Não entendi. Explique melhor
            </Link>
          </section>
        ) : (
          <Button disabled={!selectedOption || busy} onClick={onSubmit} className="min-h-12 w-full sm:w-auto sm:min-w-56">
            {busy ? <Loader size="sm" /> : "Confirmar resposta"}
          </Button>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <GhostButton disabled={currentIndex === 0} onClick={onPrevious}><ChevronLeft className="h-4 w-4" /> Anterior</GhostButton>
          {lastQuestion ? (
            <Button disabled={busy} onClick={() => onFinish(confirmIncomplete)}>{confirmIncomplete ? "Finalizar mesmo assim" : "Ver resultado"} <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button disabled={busy} onClick={onNext}>Próxima <ChevronRight className="h-4 w-4" /></Button>
          )}
        </div>
      </Card>

      <aside className="grid content-start gap-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Progresso</p>
          <div className="mt-3 flex items-end justify-between gap-3"><span className="text-3xl font-semibold text-white">{answeredCount}</span><span className="pb-1 text-xs text-muted">de {session.questions.length} respondidas</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(answeredCount / session.questions.length) * 100}%` }} /></div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {session.questions.map((item, index) => (
              <button key={item.id} type="button" onClick={() => onJump(index)} aria-label={`Ir para questão ${index + 1}`} className={`relative grid aspect-square place-items-center rounded-md border text-xs font-semibold transition ${index === currentIndex ? "border-accent bg-accent/15 text-white" : item.result?.isCorrect ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100" : item.result ? "border-rose-300/25 bg-rose-300/[0.08] text-rose-100" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
                {index + 1}{item.markedReview ? <Flag className="absolute -right-1 -top-1 h-3 w-3 text-amber-200" /> : null}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-aura">Procedência</p>
          <p className="mt-3 text-sm font-semibold text-white">{question.sourceType === "authored" ? "Questão autoral" : question.sourceName}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{question.rightsNote}</p>
          <p className="mt-3 font-mono text-[0.65rem] text-slate-600">{question.sourceReference}</p>
        </Card>
      </aside>
    </div>
  );
}

function ResultView({ summary, onHome, onRetryErrors }: { summary: QuestionSessionSummary; onHome: () => void; onRetryErrors: () => void }) {
  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <Card className="premium-glow p-5 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura">Seu resultado</p>
        <p className="energy-text mt-5 text-7xl font-semibold text-white sm:text-8xl">{summary.accuracy}%</p>
        <p className="mt-3 text-sm text-muted">{summary.correct} acertos em {summary.answered} questões respondidas</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          <Metric label="Acertos" value={String(summary.correct)} />
          <Metric label="Erros" value={String(summary.wrong)} />
          <Metric label="Em branco" value={String(summary.blank)} />
          <Metric label="Para revisar" value={String(summary.markedReview)} />
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onHome}>Voltar ao Centro</Button>
          {summary.wrong > 0 ? <GhostButton onClick={onRetryErrors}><RotateCcw className="h-4 w-4" /> Refazer erros</GhostButton> : null}
        </div>
      </Card>
    </section>
  );
}

function ErrorNotebook({ entries, busy, onRetry }: { entries: QuestionErrorEntry[]; busy: boolean; onRetry: () => void }) {
  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-aura">Caderno de erros</p><h2 className="mt-2 text-3xl font-semibold text-white">Erros que precisam virar aprendizado.</h2></div>
        <Button disabled={!entries.length || busy} onClick={onRetry}><RotateCcw className="h-4 w-4" /> Treinar novamente</Button>
      </div>
      {entries.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => {
            const selectedText = entry.alternatives.find((item) => item.key === entry.selectedOption)?.text;
            const correctText = entry.alternatives.find((item) => item.key === entry.correctOption)?.text;
            const tutorContext = `Explique esta questão de ${entry.discipline} (${entry.topic}) de outro jeito. Questão: ${entry.prompt} Minha resposta: ${entry.selectedOption} - ${selectedText}. Resposta correta: ${entry.correctOption} - ${correctText}. Explicação anterior: ${entry.explanation}`;
            return (
              <Card key={entry.questionId} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-aura">{entry.discipline} · {entry.topic}</span><span className="text-xs text-muted">{entry.accuracy}% no assunto</span></div>
                <h3 className="mt-4 text-base font-medium leading-7 text-white">{entry.prompt}</h3>
                <div className="mt-4 grid gap-2 text-sm">
                  <p className="rounded-lg border border-rose-300/20 bg-rose-300/[0.06] p-3 text-rose-100"><strong>Sua resposta: {entry.selectedOption}</strong><span className="mt-1 block text-slate-300">{selectedText}</span></p>
                  <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-emerald-100"><strong>Correta: {entry.correctOption}</strong><span className="mt-1 block text-slate-300">{correctText}</span></p>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">{entry.explanation}</p>
                <Link href={`/comandante?context=${encodeURIComponent(tutorContext)}`} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white hover:border-accent/35"><CircleHelp className="h-4 w-4 text-aura" /> Pedir outra explicação</Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mt-6 py-14 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-200" /><h3 className="mt-4 text-xl font-semibold text-white">Seu caderno está vazio.</h3><p className="mt-2 text-sm text-muted">Quando você errar uma questão, ela aparecerá aqui para revisão.</p></Card>
      )}
    </section>
  );
}

function ModeCard({ icon: Icon, eyebrow, title, description, action, disabled, onClick }: { icon: typeof Target; eyebrow: string; title: string; description: string; action: string; disabled: boolean; onClick: () => void }) {
  return <Card className="flex min-h-60 flex-col p-5"><div className="grid h-10 w-10 place-items-center rounded-lg border border-accent/20 bg-accent/[0.08] text-aura"><Icon className="h-4 w-4" /></div><p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-muted">{eyebrow}</p><h3 className="mt-2 text-xl font-semibold text-white">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-muted">{description}</p><button type="button" disabled={disabled} onClick={onClick} className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.08] px-3 text-sm font-semibold text-white transition hover:bg-accent/[0.14] disabled:cursor-not-allowed disabled:opacity-35">{action} <ArrowRight className="h-4 w-4" /></button></Card>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left"><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}

function optionState(key: QuestionOption, selected: QuestionOption | null, result: QuestionAnswerResult | null) {
  if (result) {
    if (key === result.correctOption) return { className: "border-emerald-300/35 bg-emerald-300/[0.08] text-white", keyClassName: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100", icon: <Check className="h-4 w-4" /> };
    if (key === result.selectedOption) return { className: "border-rose-300/35 bg-rose-300/[0.08] text-slate-300", keyClassName: "border-rose-300/35 bg-rose-300/10 text-rose-100", icon: <X className="h-4 w-4" /> };
    return { className: "border-white/5 bg-white/[0.015] text-slate-500", keyClassName: "border-white/10 text-slate-600", icon: null };
  }
  if (key === selected) return { className: "border-accent/50 bg-accent/[0.10] text-white", keyClassName: "border-accent/45 bg-accent/15 text-aura", icon: null };
  return { className: "border-white/10 bg-white/[0.025] text-slate-300 hover:border-accent/30 hover:bg-white/[0.045]", keyClassName: "border-white/10 text-slate-400", icon: null };
}

function firstPendingIndex(session: QuestionSession) {
  const index = session.questions.findIndex((question) => !question.selectedOption);
  return index >= 0 ? index : Math.max(0, session.questions.length - 1);
}

function buildTutorContext(question: TrainingQuestion) {
  const selectedOption = question.result?.selectedOption ?? question.selectedOption;
  const selected = question.alternatives.find((item) => item.key === selectedOption);
  const correct = question.alternatives.find((item) => item.key === question.result?.correctOption);
  return `Não entendi esta questão de ${question.discipline} (${question.topic}). Explique de forma mais simples e depois crie um exercício curto para verificar se aprendi. Questão: ${question.prompt} Minha resposta: ${selectedOption} - ${selected?.text}. Resposta correta: ${question.result?.correctOption} - ${correct?.text}. Explicação anterior: ${question.result?.explanation}`;
}
