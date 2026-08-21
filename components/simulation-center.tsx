"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flag,
  History,
  RotateCcw,
  Target,
  TimerReset,
  X
} from "lucide-react";

import { Button, Card, GhostButton, ProgressBar } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import {
  questionAreaLabel,
  questionAreas,
  type QuestionAreaKey,
  type QuestionOption,
  type QuestionSession,
  type SimulationHistoryEntry,
  type SimulationResult,
  type TrainingQuestion
} from "@/lib/questions";
import { getSupabaseClient } from "@/lib/supabase/client";

type Screen = "setup" | "exam" | "result";

const durationOptions = [
  { questions: 5, minutes: 15, label: "Aquecimento" },
  { questions: 10, minutes: 30, label: "Foco" },
  { questions: 20, minutes: 60, label: "Completo" }
] as const;

export function SimulationCenter() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [session, setSession] = useState<QuestionSession | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([]);
  const [areas, setAreas] = useState<QuestionAreaKey[]>(questionAreas.map((area) => area.key));
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);

  const finishSimulation = useCallback(async (reason: "submitted" | "time_expired") => {
    const supabase = getSupabaseClient();
    if (!supabase || !session || busy) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("complete_simulation", {
      p_session_id: session.id,
      p_ended_reason: reason
    });
    if (error || !data) {
      setMessage("Não foi possível entregar o simulado agora. Suas respostas continuam salvas.");
      setBusy(false);
      return;
    }
    setResult(data as SimulationResult);
    setSession(null);
    setScreen("result");
    setConfirmFinish(false);
    const { data: historyData } = await supabase.rpc("get_simulation_history", { p_limit: 12 });
    setHistory((historyData ?? []) as SimulationHistoryEntry[]);
    setBusy(false);
  }, [busy, session]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      window.location.assign("/");
      return;
    }
    let active = true;
    void (async () => {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session?.user) {
        window.location.assign("/");
        return;
      }
      const [{ data: activeSimulation }, { data: historyData }] = await Promise.all([
        supabase.rpc("get_active_simulation"),
        supabase.rpc("get_simulation_history", { p_limit: 12 })
      ]);
      if (!active) return;
      setHistory((historyData ?? []) as SimulationHistoryEntry[]);
      if (activeSimulation) {
        const restored = activeSimulation as QuestionSession;
        setSession(restored);
        setCurrentIndex(firstUnanswered(restored));
        setScreen("exam");
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session || screen !== "exam") return;
    const deadline = new Date(session.startedAt).getTime() + (session.timeLimitMinutes ?? 30) * 60_000;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [screen, session]);

  useEffect(() => {
    if (screen === "exam" && session && secondsLeft === 0 && !loading && !busy) {
      void finishSimulation("time_expired");
    }
  }, [busy, finishSimulation, loading, screen, secondsLeft, session]);

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const answered = session?.questions.filter((question) => question.selectedOption).length ?? 0;

  async function startSimulation() {
    const supabase = getSupabaseClient();
    if (!supabase || busy || areas.length === 0) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("start_simulation", {
      p_question_count: questionCount,
      p_area_keys: areas,
      p_time_limit_minutes: timeLimit
    });
    if (error || !data) {
      setMessage("Não foi possível montar o simulado com essa configuração.");
      setBusy(false);
      return;
    }
    const next = data as QuestionSession;
    setSession(next);
    setCurrentIndex(0);
    setScreen("exam");
    setBusy(false);
  }

  async function selectAnswer(option: QuestionOption) {
    const supabase = getSupabaseClient();
    if (!supabase || !session || !currentQuestion || busy) return;
    const previous = currentQuestion.selectedOption;
    setSession((current) => current ? {
      ...current,
      questions: current.questions.map((question) => question.id === currentQuestion.id
        ? { ...question, selectedOption: option, answeredAt: new Date().toISOString() }
        : question)
    } : current);
    const { error } = await supabase.rpc("save_simulation_answer", {
      p_session_id: session.id,
      p_question_id: currentQuestion.id,
      p_selected_option: option
    });
    if (error) {
      setSession((current) => current ? {
        ...current,
        questions: current.questions.map((question) => question.id === currentQuestion.id
          ? { ...question, selectedOption: previous }
          : question)
      } : current);
      setMessage("A resposta não foi salva. Tente novamente.");
    } else {
      setMessage("");
    }
  }

  async function toggleReview() {
    const supabase = getSupabaseClient();
    if (!supabase || !session || !currentQuestion || busy) return;
    const marked = !currentQuestion.markedReview;
    const { error } = await supabase.rpc("set_question_review", {
      p_session_id: session.id,
      p_question_id: currentQuestion.id,
      p_marked: marked
    });
    if (!error) {
      setSession((current) => current ? {
        ...current,
        questions: current.questions.map((question) => question.id === currentQuestion.id
          ? { ...question, markedReview: marked }
          : question)
      } : current);
    }
  }

  async function openResult(entry: SimulationHistoryEntry) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("get_simulation_result", { p_session_id: entry.sessionId });
    if (!error && data) {
      setResult(data as SimulationResult);
      setScreen("result");
    }
    setBusy(false);
  }

  if (loading) return <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas"><Loader size="lg" /></main>;

  return (
    <main className="mission-grid min-h-[100dvh] bg-canvas px-4 py-4 text-white sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/questoes" aria-label="Voltar para Questões" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:border-accent/35 hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
            <Image src="/aprova-ai-logo-lockup.svg" alt="AprovaAI" width={640} height={220} priority className="hidden h-9 w-auto object-contain sm:block" />
            <div><p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-aura">Ambiente de prova</p><h1 className="text-xl font-semibold sm:text-2xl">Simulado</h1></div>
          </div>
          {screen === "exam" ? <Timer seconds={secondsLeft} urgent={secondsLeft !== null && secondsLeft <= 300} /> : <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2 text-xs font-semibold text-emerald-100">Sem consumo de créditos</span>}
        </header>

        {screen === "setup" ? (
          <SetupView
            areas={areas}
            questionCount={questionCount}
            history={history}
            busy={busy}
            onToggleArea={(area) => setAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area])}
            onDuration={(questions, minutes) => { setQuestionCount(questions); setTimeLimit(minutes); }}
            onStart={() => void startSimulation()}
            onOpenResult={(entry) => void openResult(entry)}
          />
        ) : null}

        {screen === "exam" && session && currentQuestion ? (
          <ExamView
            session={session}
            question={currentQuestion}
            currentIndex={currentIndex}
            answered={answered}
            busy={busy}
            confirmFinish={confirmFinish}
            onSelect={(option) => void selectAnswer(option)}
            onToggleReview={() => void toggleReview()}
            onJump={setCurrentIndex}
            onFinish={() => answered < session.questions.length && !confirmFinish ? setConfirmFinish(true) : void finishSimulation("submitted")}
          />
        ) : null}

        {screen === "result" && result ? (
          <ResultView result={result} onBack={() => { setResult(null); setScreen("setup"); }} />
        ) : null}

        {message ? <p className="mx-auto mt-4 max-w-4xl rounded-lg border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-50">{message}</p> : null}
      </div>
    </main>
  );
}

function SetupView({ areas, questionCount, history, busy, onToggleArea, onDuration, onStart, onOpenResult }: {
  areas: QuestionAreaKey[];
  questionCount: number;
  history: SimulationHistoryEntry[];
  busy: boolean;
  onToggleArea: (area: QuestionAreaKey) => void;
  onDuration: (questions: number, minutes: number) => void;
  onStart: () => void;
  onOpenResult: (entry: SimulationHistoryEntry) => void;
}) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-5">
        <section className="command-surface premium-glow rounded-xl border border-accent/20 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura">Teste sob pressão real</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Treine decisão, tempo e resistência.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">O gabarito só aparece após a entrega. Suas respostas ficam salvas automaticamente e alimentam seu diagnóstico.</p>
        </section>

        <Card>
          <h3 className="text-lg font-semibold">1. Escolha o ritmo</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {durationOptions.map((option) => {
              const selected = questionCount === option.questions;
              return <button key={option.questions} type="button" onClick={() => onDuration(option.questions, option.minutes)} className={`rounded-lg border p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] ${selected ? "border-accent/50 bg-accent/[0.10]" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}><p className="text-xs uppercase tracking-[0.14em] text-muted">{option.label}</p><p className="mt-2 text-xl font-semibold">{option.questions} questões</p><p className="mt-1 text-sm text-aura">{option.minutes} minutos</p></button>;
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">2. Selecione as áreas</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {questionAreas.map((area) => {
              const selected = areas.includes(area.key);
              return <button key={area.key} type="button" onClick={() => onToggleArea(area.key)} className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 text-left transition-colors ${selected ? "border-accent/45 bg-accent/[0.09] text-white" : "border-white/10 bg-white/[0.02] text-muted"}`}><span className={`grid h-6 w-6 place-items-center rounded-full border ${selected ? "border-accent bg-accent text-[#041014]" : "border-white/20"}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</span><span className="text-sm font-medium">{area.shortLabel}</span></button>;
            })}
          </div>
          <Button onClick={onStart} disabled={busy || areas.length === 0} className="mt-6 min-h-12 w-full sm:w-auto sm:px-7">{busy ? <Loader size="sm" /> : <><Target className="h-4 w-4" /> Iniciar simulado</>}</Button>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-aura"><History className="h-4 w-4" /> Histórico</p>
        <div className="mt-4 grid gap-3">
          {history.length ? history.slice(0, 8).map((entry) => <button key={entry.sessionId} type="button" onClick={() => onOpenResult(entry)} className="rounded-lg border border-white/10 bg-black/20 p-3 text-left transition-colors hover:border-accent/30"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{entry.accuracy}% de acerto</span><ArrowRight className="h-4 w-4 text-aura" /></div><p className="mt-1 text-xs text-muted">{entry.answered}/{entry.questionCount} respondidas · {formatDuration(entry.durationSeconds)}</p><p className="mt-2 text-[0.7rem] text-slate-500">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(entry.completedAt))}</p></button>) : <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm leading-6 text-muted">Seu primeiro resultado aparecerá aqui para comparação.</p>}
        </div>
      </Card>
    </div>
  );
}

function ExamView({ session, question, currentIndex, answered, busy, confirmFinish, onSelect, onToggleReview, onJump, onFinish }: {
  session: QuestionSession;
  question: TrainingQuestion;
  currentIndex: number;
  answered: number;
  busy: boolean;
  confirmFinish: boolean;
  onSelect: (option: QuestionOption) => void;
  onToggleReview: () => void;
  onJump: (index: number) => void;
  onFinish: () => void;
}) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <Card className="min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-aura">{question.discipline} · {question.topic}</p><p className="mt-1 text-xs text-muted">Questão {currentIndex + 1} de {session.questions.length}</p></div><button type="button" onClick={onToggleReview} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${question.markedReview ? "border-amber-300/35 bg-amber-300/[0.08] text-amber-100" : "border-white/10 text-muted hover:text-white"}`}><Flag className="h-4 w-4" /> {question.markedReview ? "Marcada" : "Revisar depois"}</button></div>
        <p className="mt-6 whitespace-pre-wrap text-base font-medium leading-8 text-white sm:text-lg">{question.prompt}</p>
        <div className="mt-6 grid gap-3">{question.alternatives.map((alternative) => { const selected = question.selectedOption === alternative.key; return <button key={alternative.key} type="button" disabled={busy} onClick={() => onSelect(alternative.key)} className={`flex min-h-14 items-start gap-3 rounded-lg border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] ${selected ? "border-accent/50 bg-accent/[0.10] text-white" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold ${selected ? "border-accent bg-accent text-[#041014]" : "border-white/15"}`}>{alternative.key}</span><span className="pt-0.5 text-sm leading-6">{alternative.text}</span></button>; })}</div>
        <div className="mt-7 flex items-center justify-between gap-3"><GhostButton disabled={currentIndex === 0} onClick={() => onJump(currentIndex - 1)}><ChevronLeft className="h-4 w-4" /> Anterior</GhostButton>{currentIndex < session.questions.length - 1 ? <Button onClick={() => onJump(currentIndex + 1)}>Próxima <ChevronRight className="h-4 w-4" /></Button> : <Button onClick={onFinish}>Entregar simulado <CheckCircle2 className="h-4 w-4" /></Button>}</div>
        {confirmFinish ? <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-4"><p className="text-sm text-amber-50">Você deixou {session.questions.length - answered} em branco. Entregue novamente para confirmar.</p></div> : null}
      </Card>

      <Card className="h-fit lg:sticky lg:top-6">
        <div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-muted">Respondidas</p><p className="mt-1 text-2xl font-semibold">{answered}/{session.questions.length}</p></div><span className="text-sm text-aura">{Math.round(answered / session.questions.length * 100)}%</span></div>
        <ProgressBar value={answered / session.questions.length * 100} className="mt-3" />
        <div className="mt-5 grid grid-cols-5 gap-2">{session.questions.map((item, index) => <button key={item.id} type="button" onClick={() => onJump(index)} aria-label={`Ir para questão ${index + 1}`} className={`relative grid aspect-square place-items-center rounded-lg border text-xs font-semibold transition-colors ${index === currentIndex ? "border-aura bg-aura/15 text-white" : item.selectedOption ? "border-accent/30 bg-accent/[0.08] text-accent" : "border-white/10 text-muted"}`}>{index + 1}{item.markedReview ? <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-300" /> : null}</button>)}</div>
        <Button onClick={onFinish} className="mt-5 w-full">Entregar <ArrowRight className="h-4 w-4" /></Button>
      </Card>
    </div>
  );
}

function ResultView({ result, onBack }: { result: SimulationResult; onBack: () => void }) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const priority = useMemo(() => [...result.byArea].sort((a, b) => a.accuracy - b.accuracy)[0] ?? null, [result.byArea]);
  const reviewQuestion = reviewIndex === null ? null : result.questions[reviewIndex];
  return (
    <div className="mt-6 grid gap-5">
      <section className="command-surface premium-glow rounded-xl border border-accent/20 p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura">Resultado registrado</p><div className="mt-4 grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end"><div><p className="energy-text text-6xl font-semibold">{result.accuracy}%</p><p className="mt-2 text-sm text-muted">{result.correct} acertos em {result.answered} respostas</p></div><div className="lg:text-right"><p className="text-xl font-semibold">{priority ? `Prioridade: ${questionAreaLabel(priority.areaKey)}` : "Construa sua linha de base"}</p><p className="mt-2 text-sm text-muted">{result.blank} em branco · {formatDuration(result.durationSeconds)} · {result.endedReason === "time_expired" ? "tempo encerrado" : "entrega voluntária"}</p></div></div></section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{result.byArea.map((area) => <Card key={area.areaKey}><p className="text-xs uppercase tracking-[0.14em] text-muted">{questionAreaLabel(area.areaKey)}</p><p className="mt-3 text-3xl font-semibold">{area.accuracy}%</p><p className="mt-2 text-sm text-muted">{area.correct}/{area.answered} corretas</p><ProgressBar value={area.accuracy} className="mt-4" /></Card>)}</section>
      <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.14em] text-aura">Revisão técnica</p><h2 className="mt-2 text-2xl font-semibold">Veja exatamente onde perdeu pontos.</h2></div><GhostButton onClick={onBack}><RotateCcw className="h-4 w-4" /> Novo simulado</GhostButton></div><div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-[repeat(20,minmax(0,1fr))]">{result.questions.map((question, index) => <button key={question.id} type="button" onClick={() => setReviewIndex(index)} className={`grid aspect-square place-items-center rounded-lg border text-xs font-semibold ${question.selectedOption === null ? "border-white/10 text-muted" : question.result?.isCorrect ? "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100" : "border-rose-300/30 bg-rose-300/[0.08] text-rose-100"}`}>{index + 1}</button>)}</div>
        {reviewQuestion ? <div className="mt-6 rounded-lg border border-white/10 bg-black/25 p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aura">{reviewQuestion.discipline} · {reviewQuestion.topic}</p><p className="mt-3 text-sm font-medium leading-7 text-white">{reviewQuestion.prompt}</p>{reviewQuestion.selectedOption ? <div className="mt-4 grid gap-2 sm:grid-cols-2"><AnswerLine label="Sua resposta" option={reviewQuestion.selectedOption} text={reviewQuestion.alternatives.find((item) => item.key === reviewQuestion.selectedOption)?.text ?? ""} correct={Boolean(reviewQuestion.result?.isCorrect)} /><AnswerLine label="Resposta correta" option={reviewQuestion.result?.correctOption ?? "—"} text={reviewQuestion.alternatives.find((item) => item.key === reviewQuestion.result?.correctOption)?.text ?? ""} correct /></div> : <p className="mt-4 text-sm text-muted">Questão deixada em branco.</p>}<p className="mt-4 text-sm leading-7 text-slate-300">{reviewQuestion.result?.explanation ?? "Revise o assunto antes da próxima tentativa."}</p></div> : <p className="mt-5 text-sm text-muted">Selecione uma questão para abrir o gabarito comentado.</p>}
      </Card>
    </div>
  );
}

function AnswerLine({ label, option, text, correct }: { label: string; option: string; text: string; correct: boolean }) { return <div className={`rounded-lg border p-3 ${correct ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-rose-300/20 bg-rose-300/[0.06]"}`}><p className="text-xs text-muted">{label}</p><p className="mt-1 text-sm font-semibold">{option} · {text}</p></div>; }
function Timer({ seconds, urgent }: { seconds: number | null; urgent: boolean }) { return <div className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 font-mono text-sm font-semibold tabular-nums ${urgent ? "border-rose-300/30 bg-rose-300/[0.08] text-rose-100" : "border-accent/25 bg-accent/[0.07] text-aura"}`}><AlarmClock className="h-4 w-4" /> {seconds === null ? "--:--" : formatClock(seconds)}</div>; }
function firstUnanswered(session: QuestionSession) { const index = session.questions.findIndex((question) => !question.selectedOption); return index >= 0 ? index : 0; }
function formatClock(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function formatDuration(seconds: number) { const minutes = Math.floor(seconds / 60); const rest = seconds % 60; return minutes ? `${minutes}min ${rest}s` : `${rest}s`; }
