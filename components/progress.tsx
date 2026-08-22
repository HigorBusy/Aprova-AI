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
      <Card className="command-surface p-5 lg:col-span-5 lg:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.20em] text-sky-200">registro de jornada</p>
        <h2 className="mt-3 text-3xl font-light leading-tight text-white">Sua rota está deixando rastro.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Progresso real é telemetria: horas, setores concluídos, sequência e evolução semanal.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="horas de voo" value={formatHours(state.totalMinutes)} tone="blue" />
          <Stat label="setores" value={`${concluded}/${totalTopics}`} tone="green" />
          <Stat label="semana" value={`+${growth}%`} tone="aqua" />
          <Stat label="sequência" value={`${state.currentStreak}d`} tone="orange" />
        </div>
      </Card>

      <Card className="p-5 lg:col-span-7 lg:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-white">Telemetria semanal</h2>
          <Activity className="h-5 w-5 text-sky-300" />
        </div>
        <div className="mt-5 flex h-44 items-end gap-2 rounded-lg border border-white/10 bg-black/20 px-3 pt-4">
          {state.weeklyMinutes.map((minutes, index) => (
            <div key={`${index}-${minutes}`} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-[#35bfe7] opacity-90 transition-all duration-700"
                style={{ height: `${Math.max(8, (minutes / max) * 100)}%` }}
              />
              <span className="text-xs text-slate-500">{dayLabels[index]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 lg:col-span-12 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-light text-white">Constelação de estudos</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Cada ponto aceso é um dia em que a nave não ficou parada.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-sky-300" />
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

  const classes = ["bg-white/[0.045]", "bg-sky-950", "bg-blue-800", "bg-sky-500", "bg-sky-200"];

  return (
    <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-10">
      {cells.map((intensity, index) => (
        <div
          key={`${index}-${intensity}`}
          className={`aspect-square rounded-md border border-white/5 ${classes[intensity]} ${
            intensity > 2 ? "shadow-[0_10px_22px_rgba(2,7,15,0.24)]" : ""
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
