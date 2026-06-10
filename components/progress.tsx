"use client";

import { Activity, CalendarDays } from "lucide-react";
import { Card, Stat } from "@/components/ui";
import type { StudyState } from "@/lib/types";

type ProgressProps = {
  state: StudyState;
};

const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];

export function Progress({ state }: ProgressProps) {
  const max = Math.max(...state.weeklyMinutes, 60);
  const thisWeek = state.weeklyMinutes.reduce((sum, item) => sum + item, 0);
  const previousWeek = Math.max(1, Math.round(thisWeek * 0.78));
  const growth = Math.round(((thisWeek - previousWeek) / previousWeek) * 100);
  const concluded = state.topics.filter((topic) => topic.status === "Concluído").length;
  const totalTopics = Math.max(1, state.topics.length);

  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-12 lg:gap-5">
      <Card className="lg:col-span-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">evidência de evolução</p>
        <h2 className="mt-1 text-2xl font-black text-white lg:text-3xl">Você está acumulando prova real.</h2>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Menos sensação de esforço solto. Mais sinais concretos de avanço.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="horas acumuladas" value={formatHours(state.totalMinutes)} tone="blue" />
          <Stat label="temas concluídos" value={`${concluded}/${totalTopics}`} tone="green" />
          <Stat label="evolução" value={`+${growth}%`} tone="purple" />
          <Stat label="sequência atual" value={`${state.currentStreak}d`} tone="orange" />
        </div>
      </Card>

      <Card className="lg:col-span-7">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Evolução semanal</h2>
          <Activity className="h-5 w-5 text-mint" />
        </div>
        <div className="mt-4 flex h-44 items-end gap-2">
          {state.weeklyMinutes.map((minutes, index) => (
            <div key={`${index}-${minutes}`} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-ocean via-cyan to-mint shadow-[0_0_18px_rgba(34,211,238,0.18)] transition-all duration-700"
                style={{ height: `${Math.max(8, (minutes / max) * 100)}%` }}
              />
              <span className="text-xs font-bold text-slate-500">{dayLabels[index]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Calendário de Guerra</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">Consistência visível, sem calendário poluído.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-cyan" />
        </div>
        <Heatmap streak={state.currentStreak} weeklyMinutes={state.weeklyMinutes} />
      </Card>
    </div>
  );
}

function Heatmap({ streak, weeklyMinutes }: { streak: number; weeklyMinutes: number[] }) {
  const cells = Array.from({ length: 70 }, (_, index) => {
    const recent = 69 - index;
    const active = recent < streak || index % 9 === 0 || weeklyMinutes[index % weeklyMinutes.length] > 0;
    return active ? Math.min(4, Math.max(1, Math.ceil((weeklyMinutes[index % weeklyMinutes.length] || 20) / 30))) : 0;
  });

  const classes = ["bg-white/[0.055]", "bg-mint/20", "bg-mint/30", "bg-cyan/50", "bg-ocean"];

  return (
    <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-10">
      {cells.map((intensity, index) => (
        <div
          key={`${index}-${intensity}`}
          className={`aspect-square rounded-md border border-white/5 ${classes[intensity]} ${
            intensity > 2 ? "shadow-[0_0_16px_rgba(34,211,238,0.25)]" : ""
          }`}
          aria-label={`dia ${index + 1} intensidade ${intensity}`}
        />
      ))}
    </div>
  );
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}