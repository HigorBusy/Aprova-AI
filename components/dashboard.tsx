"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, FileText, Gauge, Plus, Radar, Target } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthCard } from "@/components/auth-card";
import { Button, Card, GhostButton, ProgressBar, Stat } from "@/components/ui";
import { rankFromXp } from "@/lib/study-data";
import type { StudyState } from "@/lib/types";

type DashboardProps = {
  state: StudyState;
  user: User | null;
  daysToEnem: number;
  progressPercent: number;
  onTaskToggle: (taskId: string) => void;
  onAddMinutes: (minutes: number) => void;
};

const enemDate = new Date("2026-11-08T13:30:00-03:00");
const flightBars = [18, 22, 28, 34, 42, 56, 68, 76, 72, 84, 66, 58, 49, 40, 31, 24];
const dayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function Dashboard({
  state,
  user,
  daysToEnem,
  progressPercent,
  onTaskToggle,
  onAddMinutes
}: DashboardProps) {
  const nextRank = nextRankTarget(state.xp);
  const nextTask = state.tasks.find((task) => !task.done);
  const studiedHours = formatHours(state.studiedMinutesToday);
  const totalHours = formatHours(state.totalMinutes);
  const habits = analyzeHabits(state, progressPercent);

  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <CountdownPanel daysToEnem={daysToEnem} className="lg:col-span-7" />
      <TelemetryPanel
        state={state}
        progressPercent={progressPercent}
        nextRank={nextRank}
        habits={habits}
        className="lg:col-span-5"
      />

      <WritingCenterCard className="lg:col-span-7 lg:row-span-2" />

      <Card className="lg:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">missão do dia</p>
            <h2 className="mt-2 text-2xl font-light leading-tight text-white">{nextTask?.title ?? "Revisar rota"}</h2>
          </div>
          <Target className="h-5 w-5 text-sky-300" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          O tempo vai passar de qualquer jeito. Use este bloco para executar a próxima ação, não para planejar de novo.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button onClick={() => (nextTask ? onTaskToggle(nextTask.id) : onAddMinutes(30))} className="px-3">
            {nextTask ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Executar
          </Button>
          <GhostButton onClick={() => onAddMinutes(30)} className="px-3">
            <Clock className="h-4 w-4" />
            +30 min
          </GhostButton>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">créditos</p>
            <h2 className="mt-2 text-5xl font-light text-white">1</h2>
          </div>
          <CreditCard className="h-5 w-5 text-sky-300" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">correção disponível hoje</p>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">ritmo observado</p>
            <h2 className="mt-2 text-5xl font-light text-white">{habits.consistency}%</h2>
          </div>
          <Radar className="h-5 w-5 text-sky-300" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">presença na semana atual</p>
      </Card>

      <Card className="lg:col-span-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">registro de bordo</p>
            <h2 className="mt-2 text-xl font-light text-white">Seu padrão está sendo observado.</h2>
          </div>
          <Gauge className="h-5 w-5 text-sky-300" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="hoje" value={studiedHours} tone="green" />
          <Stat label="jornada" value={totalHours} tone="blue" />
        </div>
      </Card>

      <div className="lg:col-span-12">
        <AuthCard user={user} />
      </div>
    </div>
  );
}

function CountdownPanel({ daysToEnem, className }: { daysToEnem: number; className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => getCountdown(now), [now]);

  return (
    <Card className={`command-surface p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.20em] text-sky-200">aproximação ENEM</p>
          <h2 className="mt-4 max-w-xl text-2xl font-light leading-tight text-white sm:text-4xl">
            Quanto tempo resta para chegar ao destino?
          </h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-3xl font-light text-white">{daysToEnem}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-400">dias</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
        <CountdownUnit label="meses" value={countdown.months} />
        <CountdownUnit label="dias" value={countdown.days} />
        <CountdownUnit label="horas" value={countdown.hours} />
        <CountdownUnit label="min" value={countdown.minutes} />
        <CountdownUnit label="seg" value={countdown.seconds} />
      </div>

      <div className="mt-5 h-24 overflow-hidden rounded-lg border border-white/10 bg-black/20 px-3 pt-4">
        <div className="flex h-full items-end gap-1 scanline">
          {flightBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="block flex-1 rounded-t bg-gradient-to-t from-blue-600 via-sky-400 to-sky-200 opacity-80 shadow-[0_0_18px_rgba(56,189,248,0.22)]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-light text-white sm:text-4xl">{String(value).padStart(2, "0")}</p>
      <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.10em] text-slate-500">{label}</p>
    </div>
  );
}

function TelemetryPanel({
  state,
  progressPercent,
  nextRank,
  habits,
  className
}: {
  state: StudyState;
  progressPercent: number;
  nextRank: { label: string; remaining: number; progress: number };
  habits: HabitReport;
  className?: string;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.20em] text-sky-300">relatório do comandante</p>
          <h2 className="mt-2 text-2xl font-light text-white">{habits.status}</h2>
        </div>
        <Gauge className="h-5 w-5 text-sky-300" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">{habits.summary}</p>

      <div className="mt-6 grid gap-4">
        <MetricRow label="Meta de hoje" value={`${progressPercent}%`} progress={progressPercent} />
        <MetricRow label="Consistência semanal" value={`${habits.consistency}%`} progress={habits.consistency} />
        <MetricRow label="Próxima patente" value={nextRank.label} progress={nextRank.progress} />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-slate-500">leitura de hábito</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{habits.insight}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="patente" value={rankFromXp(state.xp)} tone="purple" />
        <Stat label="sequência" value={`${state.currentStreak}d`} tone="green" />
        <Stat label="risco" value={habits.risk} tone="orange" />
      </div>
    </Card>
  );
}

function MetricRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-100">{value}</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

function WritingCenterCard({ className }: { className?: string }) {
  const [essayText, setEssayText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [result, setResult] = useState("");

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = essayText.split(/\n+/).filter((part) => part.trim().length > 0).length;

  function handleCorrection() {
    if (!essayText.trim() && !fileName) {
      setResult("Cole sua redação ou envie uma imagem antes de iniciar a correção.");
      return;
    }

    const density = wordCount >= 240 ? "extensão adequada" : "texto ainda curto";
    const structure = paragraphCount >= 4 ? "estrutura detectada" : "estrutura incompleta";
    setResult(`Pré-análise: ${density}, ${structure}. Cada redação corrigida é um erro a menos no dia da prova.`);
  }

  return (
    <Card className={`p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.20em] text-sky-300">centro de redação</p>
          <h2 className="mt-2 text-3xl font-light text-white">Corrigir minha redação</h2>
        </div>
        <FileText className="h-5 w-5 text-sky-300" />
      </div>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Cole sua redação ou envie uma imagem para receber uma análise detalhada. A nave só melhora quando os erros aparecem no painel.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1 text-sm text-slate-300">
        <span className="rounded-md bg-white/10 px-3 py-2 text-center text-white">Texto</span>
        <span className="px-3 py-2 text-center">Imagem</span>
      </div>

      <textarea
        value={essayText}
        onChange={(event) => setEssayText(event.target.value)}
        placeholder="Cole sua redação aqui..."
        className="mt-4 min-h-48 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-300/50"
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] px-3 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30">
          {fileName ?? "Enviar imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name)}
          />
        </label>
        <Button onClick={handleCorrection} className="flex-1">
          Acionar análise
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="palavras" value={`${wordCount}`} tone="blue" />
        <Stat label="parágrafos" value={`${paragraphCount}`} tone="green" />
      </div>
      {result && <p className="mt-3 rounded-lg border border-sky-300/20 bg-black/30 p-3 text-sm leading-6 text-slate-300">{result}</p>}
    </Card>
  );
}

type HabitReport = {
  consistency: number;
  status: string;
  summary: string;
  insight: string;
  risk: string;
};

function analyzeHabits(state: StudyState, progressPercent: number): HabitReport {
  const activeDays = state.weeklyMinutes.filter((minutes) => minutes > 0).length;
  const consistency = Math.round((activeDays / 7) * 100);
  const bestIndex = state.weeklyMinutes.reduce((best, minutes, index) => (minutes > state.weeklyMinutes[best] ? index : best), 0);
  const bestDay = dayNames[bestIndex];
  const average = Math.round(state.weeklyMinutes.reduce((sum, minutes) => sum + minutes, 0) / 7);
  const todayGap = Math.max(0, state.dailyGoalMinutes - state.studiedMinutesToday);

  if (progressPercent >= 100) {
    return {
      consistency,
      status: "Ritmo sob controle",
      summary: `Hoje você já cumpriu a meta. O sistema registrou ${activeDays} dias ativos nesta semana e média de ${average} minutos por dia.`,
      insight: `Seu melhor ponto recente foi ${bestDay}. Repita esse padrão antes que a energia do dia caia.`,
      risk: "baixo"
    };
  }

  if (state.studiedMinutesToday > 0) {
    return {
      consistency,
      status: "Você começou, mas ainda não fechou",
      summary: `Faltam ${todayGap} minutos para fechar a meta de hoje. O painel está acompanhando sua consistência, não só seu esforço isolado.`,
      insight: `Seu histórico mostra ${activeDays} dias ativos na semana. O próximo bloco precisa ser curto, claro e executado agora.`,
      risk: todayGap > 45 ? "médio" : "baixo"
    };
  }

  return {
    consistency,
    status: "Nenhum sinal de estudo hoje",
    summary: `Até agora não há registro de estudo hoje. A semana tem ${activeDays} dias ativos, mas hoje ainda está vazio no radar.`,
    insight: "O sistema não está julgando motivação. Ele está registrando comportamento. Sem registro, a rota fica invisível.",
    risk: "alto"
  };
}

function getCountdown(now: Date) {
  const diff = Math.max(0, enemDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const totalDays = Math.floor(totalSeconds / 86400);
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { months, days, hours, minutes, seconds };
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}

function nextRankTarget(xp: number) {
  const targets = [
    { label: "Persistente", xp: 120 },
    { label: "Estrategista", xp: 450 },
    { label: "Competidor", xp: 900 },
    { label: "Elite", xp: 1500 },
    { label: "Aprovado", xp: 2200 },
    { label: "Lendário", xp: 3000 }
  ];
  const previous = [...targets].reverse().find((target) => xp >= target.xp)?.xp ?? 0;
  const next = targets.find((target) => xp < target.xp) ?? targets[targets.length - 1];
  const range = Math.max(1, next.xp - previous);
  const progress = next.xp === previous ? 100 : Math.round(((xp - previous) / range) * 100);

  return {
    label: next.label,
    remaining: Math.max(0, next.xp - xp),
    progress
  };
}
