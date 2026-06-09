"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Trophy } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { achievements, initialState, metricValue } from "@/lib/study-data";
import { loadLocalState } from "@/lib/local-store";
import type { StudyState } from "@/lib/types";

export function AchievementsPage() {
  const [state, setState] = useState<StudyState>(() => initialState());

  useEffect(() => {
    setState(loadLocalState());
  }, []);

  const unlockedCount = achievements.filter(
    (a) => metricValue(a, state) >= a.target
  ).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white/80 transition-all duration-200 hover:shadow-sm active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-right">
          <p className="text-sm font-bold text-ocean">Aprova.AI</p>
          <h1 className="text-2xl font-black text-ink">Conquistas</h1>
        </div>
      </header>

      {/* Summary */}
      <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Progresso geral</p>
            <p className="text-2xl font-black text-ink">
              {unlockedCount}/{achievements.length}
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm">
            <Trophy className="h-6 w-6 text-reward" />
          </div>
        </div>
        <ProgressBar
          value={(unlockedCount / achievements.length) * 100}
          className="mt-3"
        />
      </div>

      {/* Achievement Cards */}
      <div className="mt-5 grid gap-4">
        {achievements.map((achievement) => {
          const value = metricValue(achievement, state);
          const unlocked = value >= achievement.target;
          const progress = Math.min(value / achievement.target, 1) * 100;

          return (
            <Card
              key={achievement.id}
              className={`transition-all duration-300 ${
                unlocked
                  ? "border-green-100 shadow-md shadow-green-100/40"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl transition-all duration-300 ${
                    unlocked
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm"
                      : "bg-slate-100"
                  }`}
                >
                  {unlocked ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black">{achievement.title}</h2>
                    {unlocked && <Trophy className="h-5 w-5 text-reward shrink-0" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {achievement.description}
                  </p>
                  <ProgressBar value={progress} className="mt-3" />
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {Math.min(value, achievement.target)}/{achievement.target} &middot;
                    +{achievement.rewardXp} XP
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
