"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, Home, Map, Orbit, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui";
import { achievements, dailyPhrases, initialState, metricValue, minutesFromStudyTime, prioritySubject, profileFromAnswers, todayKey } from "@/lib/study-data";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { addMinutes, changeTopicStatus, normalizeDailyReset, toggleTask } from "@/lib/state-helpers";
import { Quiz } from "@/components/quiz";
import { Dashboard } from "@/components/dashboard";
import { Subjects } from "@/components/subjects";
import { Progress } from "@/components/progress";
import type { QuizAnswers, StudyState } from "@/lib/types";

const enemFirstDay = new Date("2026-11-08T13:30:00-03:00");

const tabs = [
  { id: "home", label: "Controle", icon: Home },
  { id: "subjects", label: "Mapa Estelar", icon: Map },
  { id: "progress", label: "Jornada", icon: BarChart3 }
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

  const phrase = dailyPhrases[new Date().getDate() % dailyPhrases.length];
  const daysToEnem = getDaysToEnem();
  const progressPercent = Math.round((state.studiedMinutesToday / state.dailyGoalMinutes) * 100);
  const completedAchievements = achievements.filter((item) => metricValue(item, state) >= item.target);
  const nextAchievement = achievements.find((item) => metricValue(item, state) < item.target);

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
          <Orbit className="mx-auto h-8 w-8 animate-pulse text-cyan" />
          <p className="mt-3 font-black text-white">Inicializando nave AprovaAI...</p>
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
    <main className="mission-grid min-h-screen bg-canvas text-white lg:grid lg:grid-cols-[292px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-cyan/10 bg-slate-950/45 px-5 py-6 backdrop-blur-2xl lg:flex">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan">Nave AprovaAI</p>
          <h1 className="mt-2 text-2xl font-black leading-tight">Central de Controle</h1>
          <div className="mt-4 rounded-lg border border-cyan/15 bg-cyan/10 p-3">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-cyan">Comandante IA</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{phrase}</p>
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
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-left text-sm font-black transition ${
                  active
                    ? "border border-cyan/25 bg-cyan/10 text-cyan shadow-glow"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">próximo marco orbital</p>
          <p className="mt-2 text-sm font-black text-white">{nextAchievement?.title ?? "Rota completa"}</p>
          <Link href="/achievements" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber">
            <Trophy className="h-4 w-4" />
            Ver arsenal
          </Link>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="mx-auto w-full max-w-7xl animate-float-in lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan">Nave AprovaAI</p>
              <h1 className="mt-1 text-2xl font-black text-white">CENTRAL DE CONTROLE</h1>
            </div>
            <Link
              href="/achievements"
              className="grid h-11 w-11 place-items-center rounded-lg border border-amber/20 bg-amber/10 text-amber shadow-glow transition active:scale-95"
              aria-label="Arsenal"
            >
              <Trophy className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-4 rounded-lg border border-cyan/15 bg-cyan/10 p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan">transmissão do comandante</p>
            <p className="mt-1 text-sm font-bold text-white">&ldquo;{phrase}&rdquo;</p>
          </div>
        </header>

        <div className="mx-auto mt-5 w-full max-w-7xl lg:mt-0">
          {activeTab === "home" && (
            <Dashboard
              state={state}
              user={user}
              daysToEnem={daysToEnem}
              progressPercent={progressPercent}
              completedAchievements={completedAchievements.length}
              nextAchievementTitle={nextAchievement?.title ?? "Todas as conquistas liberadas"}
              onTaskToggle={(taskId) => updateState((current) => toggleTask(current, taskId))}
              onAddMinutes={(minutes) => updateState((current) => addMinutes(current, minutes))}
              onGoalChange={(minutes) => updateState((current) => ({ ...current, dailyGoalMinutes: minutes }))}
              onNameChange={(name) => updateState((current) => ({ ...current, name: name.trim() || "Candidato" }))}
            />
          )}
          {activeTab === "subjects" && (
            <Subjects
              state={state}
              onStatusChange={(topicId, status) => updateState((current) => changeTopicStatus(current, topicId, status))}
            />
          )}
          {activeTab === "progress" && <Progress state={state} />}
        </div>
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-cyan/10 bg-canvas/88 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                  active
                    ? "bg-cyan/10 text-cyan shadow-glow"
                    : "text-slate-500 hover:text-white"
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