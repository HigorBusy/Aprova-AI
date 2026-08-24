"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Shield, Trophy } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { achievements, initialState, metricValue, rankFromXp } from "@/lib/study-data";
import { loadLocalState } from "@/lib/local-store";
import { useEffect, useState } from "react";
import type { StudyState } from "@/lib/types";

export function AchievementsPage() {
  const [state, setState] = useState<StudyState>(() => initialState());

  useEffect(() => {
    setState(loadLocalState());
  }, []);

  const unlockedCount = achievements.filter((achievement) => metricValue(achievement, state) >= achievement.target).length;

  return (
    <main className="mission-grid mx-auto min-h-screen w-full max-w-md px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">Pontuei</p>
          <h1 className="text-2xl font-black text-white">ARSENAL</h1>
        </div>
      </header>

      <Card className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">conquistas desbloqueadas</p>
            <h2 className="mt-1 text-3xl font-black text-white">{unlockedCount}/{achievements.length}</h2>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-300">
            <Shield className="h-7 w-7" />
          </div>
        </div>
        <p className="mt-3 text-sm font-bold text-slate-400">
          Rank atual: <span className="text-cyan">{rankFromXp(state.xp)}</span>
        </p>
      </Card>

      <div className="mt-5 grid gap-4">
        {achievements.map((achievement) => {
          const value = metricValue(achievement, state);
          const unlocked = value >= achievement.target;
          return (
            <Card key={achievement.id} className={unlocked ? "border-cyan/25 shadow-glow" : ""}>
              <div className="flex items-start gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-lg text-2xl ${unlocked ? "bg-cyan/20 text-cyan" : "bg-white/[0.06] text-slate-500"}`}>
                  {unlocked ? achievement.icon : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black text-white">{achievement.title}</h2>
                    {unlocked && <Trophy className="h-5 w-5 text-amber-300" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {achievement.description}
                  </p>
                  <ProgressBar value={(value / achievement.target) * 100} className="mt-3" />
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {Math.min(value, achievement.target)}/{achievement.target} · +{achievement.rewardXp} XP
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