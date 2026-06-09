"use client";

import { Activity, Check, Flame, Plus, Target, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Card, GhostButton, ProgressBar, Stat } from "@/components/ui";
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

export function Dashboard({
  state,
  user,
  daysToEnem,
  progressPercent,
  completedAchievements,
  nextAchievementTitle,
  onTaskToggle,
  onAddMinutes,
  onGoalChange,
  onNameChange
}: DashboardProps) {
  const nextRank = nextRankTarget(state.xp);

  return (
    <div className="grid gap-4 animate-float-in">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ocean via-cyan to-mint" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">meta do dia</p>
            <h2 className="mt-1 text-2xl font-black text-white">{progressPercent}% conquistado</h2>
          </div>
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-right">
            <p className="text-[0.65rem] font-black uppercase text-amber-300">ENEM</p>
            <p className="text-lg font-black text-white">{daysToEnem}d</p>
          </div>
        </div>

        <ProgressBar value={progressPercent} className="mt-5" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="hoje" value={formatHours(state.studiedMinutesToday)} tone="green" />
          <Stat label="meta" value={formatHours(state.dailyGoalMinutes)} tone="blue" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[15, 30, 60].map((minutes) => (
            <GhostButton key={minutes} onClick={() => onAddMinutes(minutes)} className="px-2">
              <Plus className="h-4 w-4" />
              {minutes}m
            </GhostButton>
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="streak" value={`🔥 ${state.currentStreak} dias`} tone="orange" />
        <Stat label="xp" value={`${state.xp}`} tone="purple" />
        <Stat label="rank" value={rankFromXp(state.xp)} tone="blue" />
        <Stat label="conquistas" value={`${completedAchievements}`} tone="green" />
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">próxima conquista</p>
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
        </div>
      </Card>

      {state.currentStreak === 0 && (
        <Card className="border-reward/30 bg-reward/10">
          <div className="flex gap-3">
            <Flame className="mt-1 h-5 w-5 shrink-0 text-reward" />
            <p className="text-sm font-bold text-amber-100">
              Seu streak está vulnerável. Uma ação pequena hoje protege a identidade que você está construindo.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">Ações de avanço</h2>
          <Target className="h-5 w-5 text-cyan" />
        </div>
        <div className="mt-3 grid gap-2">
          {state.tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskToggle(task.id)}
              className={`flex min-h-12 items-center justify-between rounded-lg border px-3 text-left transition duration-200 active:scale-[0.98] ${
                task.done
                  ? "border-mint/30 bg-mint/10 text-white"
                  : "border-white/10 bg-white/[0.045] text-slate-200 hover:border-cyan/50"
              }`}
            >
              <span className="font-bold">{task.title}</span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm font-black">
                {task.done ? <Check className="h-4 w-4 text-mint" /> : `+${task.xp}`}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <WeeklyEvolution weeklyMinutes={state.weeklyMinutes} />
      <AuthCard user={user} />

      <Card>
        <label className="text-sm font-bold text-slate-300">
          Nome operacional
          <input
            defaultValue={state.name}
            onBlur={(event) => onNameChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 font-bold text-white outline-none focus:border-cyan"
          />
        </label>
        <label className="mt-4 block text-sm font-bold text-slate-300">
          Meta diária em horas
          <input
            type="number"
            min={0.5}
            max={8}
            step={0.5}
            value={state.dailyGoalMinutes / 60}
            onChange={(event) => onGoalChange(Number(event.target.value) * 60)}
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 font-bold text-white outline-none focus:border-cyan"
          />
        </label>
      </Card>
    </div>
  );
}

function WeeklyEvolution({ weeklyMinutes }: { weeklyMinutes: number[] }) {
  const max = Math.max(...weeklyMinutes, 60);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Evolução semanal</h2>
        <Activity className="h-5 w-5 text-mint" />
      </div>
      <div className="mt-4 flex h-36 items-end gap-2">
        {weeklyMinutes.map((minutes, index) => (
          <div key={`${index}-${minutes}`} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-ocean via-cyan to-mint shadow-[0_0_18px_rgba(34,211,238,0.18)] transition-all duration-700"
              style={{ height: `${Math.max(8, (minutes / max) * 100)}%` }}
            />
            <span className="text-xs font-bold text-slate-500">
              {["S", "T", "Q", "Q", "S", "S", "D"][index]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
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