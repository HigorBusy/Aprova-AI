"use client";

import { ChevronRight } from "lucide-react";
import { Button, GhostButton, ProgressBar } from "@/components/ui";
import { areas, difficulties, levels, studyTimes } from "@/lib/study-data";
import type { QuizAnswers } from "@/lib/types";

type QuizProps = {
  answers: QuizAnswers;
  step: number;
  onAnswer: (answer: QuizAnswers) => void;
  onNext: () => void;
  onBack: () => void;
};

type ScreenOption = { id: string; label: string; detail?: string };

export function Quiz({ answers, step, onAnswer, onNext, onBack }: QuizProps) {
  const screens: Array<{
    title: string;
    options: ScreenOption[];
    selected: string | undefined;
    select: (id: string) => void;
  }> = [
    {
      title: "Qual sua maior dificuldade?",
      options: difficulties,
      selected: answers.difficulty,
      select: (id) => onAnswer({ difficulty: id as QuizAnswers["difficulty"] }),
    },
    {
      title: "Quanto consegue estudar por dia?",
      options: studyTimes,
      selected: answers.studyTime,
      select: (id) => onAnswer({ studyTime: id as QuizAnswers["studyTime"] }),
    },
    {
      title: "Área com maior dificuldade?",
      options: areas,
      selected: answers.area,
      select: (id) => onAnswer({ area: id as QuizAnswers["area"] }),
    },
    {
      title: "Seu nível?",
      options: levels,
      selected: answers.level,
      select: (id) => onAnswer({ level: id as QuizAnswers["level"] }),
    },
  ];

  const screen = screens[step];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-ocean">Aprova.AI</p>
        <p className="text-sm font-bold text-slate-500">{step + 1}/4</p>
      </div>

      <ProgressBar value={((step + 1) / 4) * 100} className="mt-4" />

      <section className="mt-8 flex flex-1 flex-col">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-reward">
          Diagnóstico inicial
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink">
          {screen.title}
        </h1>

        <div className="mt-6 grid gap-3">
          {screen.options.map((option) => (
            <button
              key={option.id}
              onClick={() => screen.select(option.id)}
              className={`rounded-xl border p-4 text-left font-bold shadow-sm transition-all duration-200 active:scale-[0.98] ${
                screen.selected === option.id
                  ? "border-ocean bg-blue-50 text-blue-800 shadow-md shadow-blue-200/40"
                  : "border-white bg-white/80 text-ink hover:border-blue-200 hover:shadow"
              }`}
            >
              {option.label}
              {option.detail && (
                <span className="mt-1 block text-sm font-medium text-slate-500">
                  {option.detail}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[0.7fr_1fr] gap-3 pt-6">
        <GhostButton onClick={onBack} disabled={step === 0}>
          Voltar
        </GhostButton>
        <Button onClick={onNext} disabled={!screen.selected}>
          {step === 3 ? "Gerar plano" : "Continuar"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
