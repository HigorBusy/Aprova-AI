"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, BookOpen, Home, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui";
import { achievements, dailyPhrases, initialState, metricValue, minutesFromStudyTime, prioritySubject, profileFromAnswers, todayKey } from "@/lib/study-data";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { addMinutes, changeTopicStatus, mentorReply, normalizeDailyReset, toggleTask } from "@/lib/state-helpers";
import { Quiz } from "@/components/quiz";
import { Dashboard } from "@/components/dashboard";
import { Subjects } from "@/components/subjects";
import { Progress } from "@/components/progress";
import { Mentor } from "@/components/mentor";
import type { QuizAnswers, StudyState } from "@/lib/types";

const tabs = [
  { id: "home", label: "Hoje", icon: Home },
  { id: "subjects", label: "Temas", icon: BookOpen },
  { id: "progress", label: "Evolução", icon: BarChart3 },
  { id: "mentor", label: "Mentor", icon: MessageCircle },
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
        daily_goal_minutes: state.dailyGoalMinutes,
      }),
      supabase
        .from("daily_progress")
        .upsert(
          {
            user_id: user.id,
            progress_date: todayKey(),
            studied_minutes: state.studiedMinutesToday,
            tasks_completed: state.completedTasks,
            questions_answered: state.questionCount,
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
            last_study_date: state.studiedMinutesToday > 0 ? todayKey() : null,
          },
          { onConflict: "user_id" }
        ),
    ]);
  }, [user, state]);

  const phrase = dailyPhrases[new Date().getDate() % dailyPhrases.length];
  const progressPercent = Math.round(
    (state.studiedMinutesToday / state.dailyGoalMinutes) * 100
  );
  const completedAchievements = achievements.filter(
    (item) => metricValue(item, state) >= item.target
  );
  const nextAchievement = achievements.find(
    (item) => metricValue(item, state) < item.target
  );

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
        `Seu foco inicial é ${priority}. Comece pequeno e marque presença hoje.`,
        ...current.notifications.slice(0, 2),
      ],
      topics: current.topics.map((topic) =>
        topic.subject === priority && topic.status === "Não iniciado"
          ? { ...topic, status: "Estudando" as const }
          : topic
      ),
    }));
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <Card className="w-full max-w-sm text-center">
          <Sparkles className="mx-auto h-8 w-8 text-ocean animate-pulse" />
          <p className="mt-3 font-bold">Preparando seu plano...</p>
        </Card>
      </main>
    );
  }

  if (!state.profileKind) {
    return (
      <Quiz
        answers={answers}
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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
      {/* Header */}
      <header className="animate-float-in">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ocean">Aprova.AI</p>
            <h1 className="text-2xl font-black text-ink">Oi, {state.name}</h1>
          </div>
          <Link
            href="/achievements"
            className="grid h-11 w-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-reward shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
            aria-label="Conquistas"
          >
            <Trophy className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-semibold text-slate-700 italic">
          &ldquo;{phrase}&rdquo;
        </p>
      </header>

      {/* Tab Content */}
      <div className="mt-5">
        {activeTab === "home" && (
          <Dashboard
            state={state}
            user={user}
            progressPercent={progressPercent}
            completedAchievements={completedAchievements.length}
            nextAchievementTitle={nextAchievement?.title ?? "Tudo desbloqueado"}
            onTaskToggle={(taskId) =>
              updateState((current) => toggleTask(current, taskId))
            }
            onAddMinutes={(minutes) =>
              updateState((current) => addMinutes(current, minutes))
            }
            onGoalChange={(minutes) =>
              updateState((current) => ({ ...current, dailyGoalMinutes: minutes }))
            }
            onNameChange={(name) =>
              updateState((current) => ({
                ...current,
                name: name.trim() || "Estudante",
              }))
            }
          />
        )}
        {activeTab === "subjects" && (
          <Subjects
            state={state}
            onStatusChange={(topicId, status) =>
              updateState((current) => changeTopicStatus(current, topicId, status))
            }
          />
        )}
        {activeTab === "progress" && <Progress state={state} />}
        {activeTab === "mentor" && (
          <Mentor
            messages={state.mentorMessages}
            onSend={(message) =>
              updateState((current) => ({
                ...current,
                mentorMessages: [...current.mentorMessages, message, mentorReply()],
              }))
            }
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/80 bg-white/85 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-2 py-2 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-ocean shadow-sm shadow-blue-100"
                    : "text-slate-500 hover:text-slate-700"
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
