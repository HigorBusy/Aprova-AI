"use client";

import { ChevronRight } from "lucide-react";
import { Button, GhostButton, ProgressBar } from "@/components/ui";
import { areas, difficulties, levels, studyFrequencies, targetExams } from "@/lib/study-data";
import type { QuizAnswers } from "@/lib/types";

type QuizProps = {
  answers: QuizAnswers;
  daysToEnem: number;
  step: number;
  onAnswer: (answer: QuizAnswers) => void;
  onNext: () => void;
  onBack: () => void;
};

type ScreenOption = { id: string; label: string; detail?: string };

export function Quiz({ answers, daysToEnem, step, onAnswer, onNext, onBack }: QuizProps) {
  const screens: Array<{
    title: string;
    options: ScreenOption[];
    selected: string | undefined;
    select: (id: string) => void;
  }> = [
    {
      title: "Qual edição do ENEM é o seu foco?",
      options: targetExams,
      selected: answers.targetExam,
      select: (id) => onAnswer({ targetExam: id as QuizAnswers["targetExam"] })
    },
    {
      title: "Qual é sua maior dificuldade hoje?",
      options: difficulties,
      selected: answers.difficulty,
      select: (id) => onAnswer({ difficulty: id as QuizAnswers["difficulty"] })
    },
    {
      title: "Qual área mais precisa de atenção?",
      options: areas,
      selected: answers.area,
      select: (id) => onAnswer({ area: id as QuizAnswers["area"] })
    },
    {
      title: "Como você avalia sua redação hoje?",
      options: levels,
      selected: answers.level,
      select: (id) => onAnswer({ level: id as QuizAnswers["level"] })
    },
    {
      title: "Com que frequência você consegue estudar?",
      options: studyFrequencies,
      selected: answers.studyFrequency,
      select: (id) => onAnswer({ studyFrequency: id as QuizAnswers["studyFrequency"] })
    }
  ];

  const screen = screens[step];

  return (
    <main className="mission-grid mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.20em] text-aura">Seu diagnóstico inicial</p>
        <p className="text-sm font-medium text-muted">{step + 1}/{screens.length}</p>
      </div>

      <section className="command-surface premium-glow mt-7 rounded-lg border border-accent/25 p-4">
        <p className="text-sm font-medium text-white">O ENEM está se aproximando.</p>
        <div className="mt-3 flex items-end gap-3">
          <span className="energy-text text-6xl font-semibold leading-none text-white">{daysToEnem}</span>
          <span className="pb-2 text-sm font-medium uppercase tracking-[0.12em] text-aura">
            dias até o ENEM
          </span>
        </div>
        <ProgressBar value={((step + 1) / screens.length) * 100} className="mt-5" />
      </section>

      <section className="mt-8 flex flex-1 flex-col">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Leva menos de um minuto
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
          {screen.title}
        </h1>

        <div className="mt-6 grid gap-3">
          {screen.options.map((option) => (
            <button
              key={option.id}
              onClick={() => screen.select(option.id)}
              className={`rounded-lg border p-4 text-left font-medium transition duration-300 active:scale-[0.98] ${
                screen.selected === option.id
                  ? "border-accent/70 bg-accent/20 text-white shadow-[0_0_30px_rgba(58,167,216,0.22)]"
                  : "border-white/10 bg-white/[0.045] text-slate-200 hover:border-accent/50 hover:bg-white/[0.06]"
              }`}
            >
              {option.label}
              {option.detail && (
                <span className="mt-1 block text-sm font-normal text-muted">
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
          {step === screens.length - 1 ? "Ver meu próximo passo" : "Continuar"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
