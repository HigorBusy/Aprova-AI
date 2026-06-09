"use client";

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
  const totalHours = Math.round(state.totalMinutes / 60);
  const weekHours = Math.round((thisWeek / 60) * 10) / 10;
  const monthHours = Math.round((state.totalMinutes / 60) * 10) / 10;

  return (
    <div className="grid gap-4 animate-float-in">
      {/* Overview */}
      <Card>
        <p className="text-sm font-bold text-ocean">Veja sua evolução</p>
        <h2 className="mt-1 text-2xl font-black">Você está realmente avançando.</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Total" value={`${totalHours}h`} tone="blue" />
          <Stat label="Semana" value={`${weekHours}h`} tone="green" />
          <Stat label="Mês" value={`${monthHours}h`} tone="purple" />
          <Stat label="Temas" value={`${concluded}`} tone="orange" />
        </div>
      </Card>

      {/* Weekly Chart */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Evolução semanal</h2>
          <span className="rounded-lg bg-green-50 px-2 py-1 text-sm font-black text-mint">
            +{growth}%
          </span>
        </div>
        <div className="mt-4 flex h-36 items-end gap-2">
          {state.weeklyMinutes.map((minutes, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-ocean to-mint transition-all duration-500"
                style={{ height: `${Math.max(8, (minutes / max) * 100)}%` }}
              />
              <span className="text-xs font-bold text-slate-500">{dayLabels[index]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Consistency Calendar */}
      <Card>
        <h2 className="text-lg font-black">Calendário de consistência</h2>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, index) => {
            const filled = index < Math.min(28, state.currentStreak + 8);
            return (
              <div
                key={index}
                className={`aspect-square rounded-md transition-all duration-300 ${
                  filled
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm shadow-green-200"
                    : "bg-slate-100"
                }`}
              />
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          {state.currentStreak} dias de consistência este mês
        </p>
      </Card>
    </div>
  );
}
