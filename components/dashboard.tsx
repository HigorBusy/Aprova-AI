"use client";

import { Plus, Check, Target } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Card, GhostButton, ProgressBar, Stat } from "@/components/ui";
import { rankFromXp } from "@/lib/study-data";
import { AuthCard } from "@/components/auth-card";
import type { StudyState } from "@/lib/types";

type DashboardProps = {
  state: StudyState;
  user: User | null;
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
  progressPercent,
  completedAchievements,
  nextAchievementTitle,
  onTaskToggle,
  onAddMinutes,
  onGoalChange,
  onNameChange,
}: DashboardProps) {
  const todayHours = Math.round((state.studiedMinutesToday / 60) * 10) / 10;
  const goalHours = Math.round((state.dailyGoalMinutes / 60) * 10) / 10;

  return (
    <div className="grid gap-4 animate-float-in">
      <AuthCard user={user} />

      {/* Daily Goal */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">{state.profileKind}</p>
            <h2 className="mt-1 text-xl font-black">Meta diária</h2>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-black text-mint">
            {progressPercent}%
          </div>
        </div>

        <ProgressBar value={progressPercent} className="mt-4" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Hoje" value={`${todayHours}h`} tone="green" />
          <Stat label="Meta" value={`${goalHours}h`} tone="blue" />
        </div>

        {/* Quick add minutes */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[15, 30, 60].map((minutes) => (
            <GhostButton key={minutes} onClick={() => onAddMinutes(minutes)} className="px-2">
              <Plus className="h-4 w-4" />
              {minutes}m
            </GhostButton>
          ))}
        </div>

        {/* Goal input */}
        <label className="mt-4 block text-sm font-bold text-slate-600">
          Horas por dia
          <input
            type="number"
            min={0.5}
            max={8}
            step={0.5}
            value={state.dailyGoalMinutes / 60}
            onChange={(event) => onGoalChange(Number(event.target.value) * 60)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-bold outline-none transition focus:border-ocean focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </Card>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`${state.currentStreak}d`} tone="orange" />
        <Stat label="XP" value={`${state.xp}`} tone="purple" />
        <Stat label="Rank" value={rankFromXp(state.xp)} tone="blue" />
        <Stat label="Conquistas" value={`${completedAchievements}`} tone="green" />
      </section>

      {/* Daily Checklist */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Checklist diário</h2>
          <Target className="h-5 w-5 text-ocean" />
        </div>
        <div className="mt-3 grid gap-2">
          {state.tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskToggle(task.id)}
              className={`flex min-h-12 items-center justify-between rounded-xl border px-3 text-left transition-all duration-200 ${
                task.done
                  ? "border-green-100 bg-green-50 text-green-800"
                  : "border-slate-100 bg-white/80 text-ink hover:border-blue-200 hover:shadow-sm"
              }`}
            >
              <span className="font-bold">{task.title}</span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm">
                {task.done ? (
                  <Check className="h-4 w-4 text-mint" />
                ) : (
                  <span className="text-xs font-black text-ocean">+{task.xp}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Smart Alerts */}
      <Card>
        <h2 className="text-lg font-black">Alertas inteligentes</h2>
        <div className="mt-3 grid gap-2">
          {state.notifications.map((notification) => (
            <p
              key={notification}
              className="rounded-lg bg-orange-50 p-3 text-sm font-semibold text-orange-800"
            >
              {notification}
            </p>
          ))}
        </div>
      </Card>

      {/* Name & Next Achievement */}
      <Card>
        <label className="text-sm font-bold text-slate-600">
          Nome na saudação
          <input
            defaultValue={state.name}
            onBlur={(event) => onNameChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-bold outline-none transition focus:border-ocean focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          Próxima conquista: {nextAchievementTitle}
        </p>
      </Card>
    </div>
  );
}
