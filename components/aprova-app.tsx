"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Bot, Home, Orbit, UserCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { dailyPhrases, initialState, minutesFromStudyTime, prioritySubject, profileFromAnswers, todayKey } from "@/lib/study-data";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { addMinutes, normalizeDailyReset, toggleTask } from "@/lib/state-helpers";
import { Quiz } from "@/components/quiz";
import { Dashboard } from "@/components/dashboard";
import { Copilot } from "@/components/copilot";
import type { QuizAnswers, StudyState } from "@/lib/types";

const enemFirstDay = new Date("2026-11-08T13:30:00-03:00");

const tabs = [
  { id: "home", label: "Central de controle", icon: Home },
  { id: "copilot", label: "Copiloto IA", icon: Bot }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AprovaApp() {
  const [state, setState] = useState<StudyState>(() => initialState());
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizStep, setQuizStep] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(normalizeDailyReset(loadLocalState()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveLocalState(state);
  }, [ready, state]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let mounted = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => mounted && setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !state.profileKind) return;
    void Promise.all([
      supabase.from("profiles").upsert({
        id: user.id,
        full_name: state.name,
        quiz_profile: state.profileKind,
        daily_goal_minutes: state.dailyGoalMinutes
      }),
      supabase
        .from("daily_progress")
        .upsert(
          {
            user_id: user.id,
            progress_date: todayKey(),
            studied_minutes: state.studiedMinutesToday,
            tasks_completed: state.completedTasks,
            questions_answered: state.questionCount
          },
          { onConflict: "user_id,progress_date" }
        ),
      supabase
        .from("streaks")
        .upsert(
          {
            user_id: user.id,
            current_streak: state.currentStreak,
            best_streak: state.bestStreak,
            last_study_date: state.studiedMinutesToday > 0 ? todayKey() : null
          },
          { onConflict: "user_id" }
        )
    ]);
  }, [user, state]);

  const phrase = dailyPhrases[0];
  const daysToEnem = getDaysToEnem();
  const progressPercent = Math.round((state.studiedMinutesToday / state.dailyGoalMinutes) * 100);

  function updateState(updater: (current: StudyState) => StudyState) {
    setState((current) => updater(current));
  }

  function finishQuiz() {
    const profileKind = profileFromAnswers(answers);
    const dailyGoalMinutes = minutesFromStudyTime(answers.studyTime);
    const priority = prioritySubject(answers.area);
    updateState((current) => ({
      ...current,
      profileKind,
      dailyGoalMinutes,
      notifications: [
        `${priority} virou seu primeiro setor de navegação. A rota começa hoje.`,
        ...current.notifications.slice(0, 2)
      ],
      topics: current.topics.map((topic) =>
        topic.subject === priority && topic.status === "Não iniciado"
          ? { ...topic, status: "Estudando" as const }
          : topic
      )
    }));
  }

  if (!ready) {
    return (
      <main className="mission-grid flex min-h-screen items-center justify-center px-5">
        <Card className="w-full max-w-sm text-center">
          <Orbit className="mx-auto h-7 w-7 animate-pulse text-sky-300" />
          <p className="mt-3 text-sm font-medium text-slate-200">Inicializando nave AprovaAI...</p>
        </Card>
      </main>
    );
  }

  if (!state.profileKind) {
    return (
      <Quiz
        answers={answers}
        daysToEnem={daysToEnem}
        step={quizStep}
        onAnswer={(next) => setAnswers((current) => ({ ...current, ...next }))}
        onNext={() =>
          quizStep >= 3 ? finishQuiz() : setQuizStep((step) => step + 1)
        }
        onBack={() => setQuizStep((step) => Math.max(0, step - 1))}
      />
    );
  }

  return (
    <main className="mission-grid min-h-screen bg-canvas text-white lg:grid lg:grid-cols-[284px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-black/40 px-5 py-6 backdrop-blur-2xl lg:flex">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300">AprovaAI</p>
              <h1 className="mt-2 text-2xl font-light leading-tight text-white">Central de controle</h1>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-sm text-slate-300">
              {state.name.slice(0, 1).toUpperCase()}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.045] p-3">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-slate-500">comando do dia</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{phrase}</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                  active
                    ? "border border-sky-300/20 bg-sky-300/10 text-sky-100"
                    : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">perfil</p>
              <p className="mt-1 text-sm text-slate-200">{state.profileKind}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">plano atual</p>
            <p className="mt-1 text-sm text-sky-100">Gratuito</p>
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="mx-auto w-full max-w-7xl animate-float-in lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300">AprovaAI</p>
              <h1 className="mt-1 text-2xl font-light text-white">{activeTab === "home" ? "Central de controle" : "Copiloto IA"}</h1>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300">
              {state.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.045] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">comando do dia</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{phrase}</p>
          </div>
        </header>

        <div className="mx-auto mt-5 w-full max-w-7xl lg:mt-0">
          {activeTab === "home" && (
            <Dashboard
              state={state}
              user={user}
              daysToEnem={daysToEnem}
              progressPercent={progressPercent}
              onTaskToggle={(taskId) => updateState((current) => toggleTask(current, taskId))}
              onAddMinutes={(minutes) => updateState((current) => addMinutes(current, minutes))}
              onGoalChange={(minutes) => updateState((current) => ({ ...current, dailyGoalMinutes: minutes }))}
              onNameChange={(name) => updateState((current) => ({ ...current, name: name.trim() || "Candidato" }))}
            />
          )}
          {activeTab === "copilot" && <Copilot />}
        </div>
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-2 py-2 text-xs transition ${
                  active
                    ? "bg-sky-300/10 text-sky-100"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon className="mx-auto h-5 w-5" />
                <span className="mt-1 block">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function getDaysToEnem() {
  const diff = enemFirstDay.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
