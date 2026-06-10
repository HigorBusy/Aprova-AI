"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, FileText, Flame, Plus, Target, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Card, Button, GhostButton, ProgressBar, Stat } from "@/components/ui";
import { rankFromXp } from "@/lib/study-data";
import { AuthCard } from "@/components/auth-card";
import type { StudyState } from "@/lib/types";

type DashboardProps = {
  state: StudyState;
  user: User | null;
  daysToEnem: number;
  progressPercent: number;
  completedAchievements: number;
  nextAchievementTitle: string;
  onTaskToggle: (taskId: string) => void;
  onAddMinutes: (minutes: number) => void;
  onGoalChange: (minutes: number) => void;
  onNameChange: (name: string) => void;
};

const enemDate = new Date("2026-11-08T13:30:00-03:00");

export function Dashboard({
  state,
  user,
  daysToEnem,
  progressPercent,
  completedAchievements,
  nextAchievementTitle,
  onTaskToggle,
  onAddMinutes
}: DashboardProps) {
  const nextRank = nextRankTarget(state.xp);
  const nextTask = state.tasks.find((task) => !task.done);
  const studiedHours = formatHours(state.studiedMinutesToday);
  const totalHours = formatHours(state.totalMinutes);

  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <CountdownCard daysToEnem={daysToEnem} className="lg:col-span-7" />
      <EssayCorrectionCard className="lg:col-span-5 lg:row-span-2" />

      <Card className="lg:col-span-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">plano atual</p>
            <h2 className="mt-1 text-xl font-black text-white">Gratuito</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-right">
            <p className="text-[0.65rem] font-black uppercase text-slate-400">meta</p>
            <p className="text-sm font-black text-white">{formatHours(state.dailyGoalMinutes)}/dia</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold text-slate-400">
          Você tem 1 correção gratuita por dia. O tempo vai passar de qualquer jeito.
        </p>
        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
          <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
            <span>Mensal</span>
            <span className="text-cyan">R$19,90</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
            <span>Trimestral</span>
            <span className="text-mint">R$39,90</span>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">créditos</p>
            <h2 className="mt-1 text-3xl font-black text-white">1</h2>
          </div>
          <CreditCard className="h-6 w-6 text-cyan" />
        </div>
        <p className="mt-2 text-sm font-bold text-slate-400">correção disponível hoje</p>
        <div className="mt-4 rounded-lg border border-cyan/20 bg-cyan/10 p-3 text-sm font-black text-cyan">
          Gratuito: 1 correção/dia
        </div>
      </Card>

      <Card className="lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">progresso real</p>
            <h2 className="mt-1 text-xl font-black text-white">{progressPercent}% da missão diária</h2>
          </div>
          <Flame className="h-6 w-6 text-reward" />
        </div>
        <ProgressBar value={progressPercent} className="mt-4" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Stat label="hoje" value={studiedHours} tone="green" />
          <Stat label="total" value={totalHours} tone="blue" />
          <Stat label="rank" value={rankFromXp(state.xp)} tone="purple" />
          <Stat label="streak" value={`${state.currentStreak}d`} tone="orange" />
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">próxima ação recomendada</p>
            <h2 className="mt-1 text-xl font-black text-white">{nextTask?.title ?? "Revisar evolução"}</h2>
          </div>
          <Target className="h-6 w-6 text-mint" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-400">
          Você não precisa estudar mais. Precisa estudar com direção.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => (nextTask ? onTaskToggle(nextTask.id) : onAddMinutes(30))} className="px-3">
            {nextTask ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Executar
          </Button>
          <GhostButton onClick={() => onAddMinutes(30)} className="px-3">
            <Clock className="h-4 w-4" />
            +30m
          </GhostButton>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">conquista</p>
            <h2 className="mt-1 text-lg font-black text-white">{nextAchievementTitle}</h2>
          </div>
          <Trophy className="h-6 w-6 text-amber-300" />
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-slate-300">Próximo rank</span>
            <span className="text-cyan">{nextRank.label}</span>
          </div>
          <ProgressBar value={nextRank.progress} className="mt-3" />
          <p className="mt-2 text-xs font-bold text-slate-500">{nextRank.remaining} XP restantes</p>
          <p className="mt-2 text-xs font-bold text-slate-500">{completedAchievements} conquistas liberadas</p>
        </div>
      </Card>

      <div className="lg:col-span-12">
        <AuthCard user={user} />
      </div>
    </div>
  );
}

function CountdownCard({ daysToEnem, className }: { daysToEnem: number; className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => getCountdown(now), [now]);

  return (
    <Card className={`relative overflow-hidden ${className ?? ""}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ocean via-cyan to-mint" />
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">Contagem regressiva para o ENEM</p>
      <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">O tempo vai passar de qualquer jeito.</h2>
      <p className="mt-3 text-sm font-bold text-slate-400">{daysToEnem} dias corridos até a primeira prova.</p>
      <div className="mt-5 grid grid-cols-5 gap-2">
        <CountdownUnit label="meses" value={countdown.months} />
        <CountdownUnit label="dias" value={countdown.days} />
        <CountdownUnit label="horas" value={countdown.hours} />
        <CountdownUnit label="min" value={countdown.minutes} />
        <CountdownUnit label="seg" value={countdown.seconds} />
      </div>
    </Card>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-2 text-center sm:p-3">
      <p className="text-2xl font-black text-white sm:text-3xl">{String(value).padStart(2, "0")}</p>
      <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
    </div>
  );
}

function EssayCorrectionCard({ className }: { className?: string }) {
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

    const density = wordCount >= 240 ? "boa extensão" : "texto ainda curto";
    const structure = paragraphCount >= 4 ? "estrutura próxima do esperado" : "estrutura precisa de mais blocos";
    setResult(`Pré-análise: ${density}, ${structure}. Cada redação corrigida é um erro a menos no dia da prova.`);
  }

  return (
    <Card className={`border-cyan/20 bg-cyan/10 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">ferramenta principal</p>
          <h2 className="mt-1 text-2xl font-black text-white">Corrigir minha redação</h2>
        </div>
        <FileText className="h-7 w-7 text-cyan" />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-300">
        Cole sua redação ou envie uma imagem para receber uma análise detalhada.
      </p>
      <textarea
        value={essayText}
        onChange={(event) => setEssayText(event.target.value)}
        placeholder="Cole sua redação aqui..."
        className="mt-4 min-h-36 w-full resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-cyan"
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-black text-white transition hover:border-cyan/50">
          {fileName ?? "Enviar imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name)}
          />
        </label>
        <Button onClick={handleCorrection} className="flex-1">
          Corrigir redação
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
        <span>{wordCount} palavras</span>
        <span>{paragraphCount} parágrafos</span>
      </div>
      {result && <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm font-bold text-slate-200">{result}</p>}
    </Card>
  );
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