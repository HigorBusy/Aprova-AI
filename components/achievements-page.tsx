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

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white/80" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-right">
          <p className="text-sm font-bold text-ocean">Aprova.AI</p>
          <h1 className="text-2xl font-black text-ink">Conquistas</h1>
        </div>
      </header>

      <div className="mt-5 grid gap-4">
        {achievements.map((achievement) => {
          const value = metricValue(achievement, state);
          const unlocked = value >= achievement.target;
          return (
            <Card key={achievement.id} className={unlocked ? "border-green-100" : ""}>
              <div className="flex items-start gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-lg text-2xl ${unlocked ? "bg-green-50" : "bg-slate-100"}`}>
                  {unlocked ? achievement.icon : <Lock className="h-5 w-5 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black">{achievement.title}</h2>
                    {unlocked && <Trophy className="h-5 w-5 text-reward" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{achievement.description}</p>
                  <ProgressBar value={(value / achievement.target) * 100} className="mt-3" />
                  <p className="mt-2 text-xs font-bold text-slate-500">{Math.min(value, achievement.target)}/{achievement.target} · +{achievement.rewardXp} XP</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
