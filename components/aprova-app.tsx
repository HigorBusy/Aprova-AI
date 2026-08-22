"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChartNoAxesCombined, ClipboardList, CreditCard, Database, FileText, GraduationCap, LogOut, ShieldCheck } from "lucide-react";

import { AuthScreen } from "@/components/auth-screen";
import { BrandTransition } from "@/components/brand-transition";
import { Dashboard } from "@/components/dashboard";
import { Quiz } from "@/components/quiz";
import { GhostButton } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import { getDaysToEnem } from "@/lib/constants";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import {
  initialState,
  minutesFromStudyFrequency,
  prioritySubject,
  profileFromAnswers,
  todayKey
} from "@/lib/study-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlanTag, ProfileKind, QuizAnswers, StudyState } from "@/lib/types";

const tabs = [
  { id: "home", label: "Hoje", icon: FileText, href: "/" },
  { id: "questions", label: "Questões", icon: ClipboardList, href: "/questoes" },
  { id: "diagnostic", label: "Evolução", icon: ChartNoAxesCombined, href: "/diagnostico" },
  { id: "commander", label: "Tutor IA", icon: GraduationCap, href: "/comandante" }
] as const;

const adminTab = { id: "admin", label: "Painel ADM", icon: Database, href: "/admin" } as const;
const SESSION_TIMEOUT_MS = 8_000;
const ACCOUNT_TIMEOUT_MS = 12_000;

type ProfileRow = {
  full_name: string | null;
  name: string | null;
  quiz_profile: ProfileKind | null;
  daily_goal_minutes: number;
  plan_tag: PlanTag;
  is_blocked: boolean;
};

export function AprovaApp() {
  const [state, setState] = useState<StudyState>(() => initialState());
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizStep, setQuizStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountReloadKey, setAccountReloadKey] = useState(0);
  const [transitionLabel, setTransitionLabel] = useState<string | null>(null);
  const [planTag, setPlanTag] = useState<PlanTag>("free");
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const transitioningUserRef = useRef<string | null>(null);

  const beginSession = useCallback((nextUser: User, label = "Preparando seu painel") => {
    if (transitioningUserRef.current === nextUser.id || user?.id === nextUser.id) return;
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);

    transitioningUserRef.current = nextUser.id;
    setAuthLoading(false);
    setTransitionLabel(label);
    transitionTimerRef.current = window.setTimeout(() => {
      setUser(nextUser);
      setTransitionLabel(null);
      transitioningUserRef.current = null;
    }, 1800);
  }, [user?.id]);

  useEffect(() => {
    setState(loadLocalState());
    setLocalReady(true);
  }, []);

  useEffect(() => {
    if (localReady) saveLocalState(state);
  }, [localReady, state]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    void withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      "Tempo limite ao restaurar sessão."
    )
      .then(({ data }) => {
        if (!mounted) return;
        if (data.session?.user) beginSession(data.session.user, "Restaurando sua sessão");
        else setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthLoading(false);
        setUser(null);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setPlanTag("free");
        setCreditBalance(null);
        setAccountLoading(false);
        setTransitionLabel(null);
        transitioningUserRef.current = null;
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        beginSession(session.user);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    };
  }, [beginSession]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    let mounted = true;
    setAccountLoading(true);
    setAccountError("");
    void (async () => {
      try {
        const [profileResult, creditsResult] = await withTimeout(
          Promise.all([
            supabase
              .from("profiles")
              .select("full_name,name,quiz_profile,daily_goal_minutes,plan_tag,is_blocked")
              .eq("id", user.id)
              .maybeSingle<ProfileRow>(),
            supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle()
          ]),
          ACCOUNT_TIMEOUT_MS,
          "Tempo limite ao carregar conta."
        );

        if (profileResult.error || creditsResult.error) {
          throw profileResult.error ?? creditsResult.error;
        }
        if (!mounted) return;

        const profile = profileResult.data;
        if (profile?.is_blocked) {
          setAccountError("Seu acesso ao AprovaAI está bloqueado. Entre em contato com o suporte para revisar sua conta.");
          return;
        }
        if (profile) {
          setPlanTag(profile.plan_tag ?? "free");
          setState((current) => ({
            ...current,
            name: profile.name || profile.full_name || current.name,
            profileKind: profile.quiz_profile,
            dailyGoalMinutes: profile.daily_goal_minutes || current.dailyGoalMinutes
          }));
        }
        setCreditBalance(creditsResult.data?.balance ?? 0);
      } catch {
        if (mounted) setAccountError("Não foi possível carregar seu perfil e seus créditos.");
      } finally {
        if (mounted) setAccountLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [accountReloadKey, user]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !state.profileKind || accountLoading) return;

    void supabase.from("profiles").update({
      name: state.name,
      full_name: state.name,
      quiz_profile: state.profileKind,
      daily_goal_minutes: state.dailyGoalMinutes
    }).eq("id", user.id);
  }, [accountLoading, state.dailyGoalMinutes, state.name, state.profileKind, user]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !state.profileKind || accountLoading) return;

    const dateKey = todayKey();
    void Promise.all([
      supabase.from("daily_progress").upsert(
        {
          user_id: user.id,
          progress_date: dateKey,
          date_key: dateKey,
          studied_minutes: state.studiedMinutesToday,
          tasks_completed: state.completedTasks,
          questions_answered: state.questionCount
        },
        { onConflict: "user_id,date_key" }
      ),
      supabase.from("streaks").upsert(
        {
          user_id: user.id,
          current_streak: state.currentStreak,
          best_streak: state.bestStreak,
          last_study_date: state.studiedMinutesToday > 0 ? dateKey : null,
          last_study_date_key: state.studiedMinutesToday > 0 ? dateKey : null
        },
        { onConflict: "user_id" }
      )
    ]);
  }, [
    accountLoading,
    state.bestStreak,
    state.completedTasks,
    state.currentStreak,
    state.profileKind,
    state.questionCount,
    state.studiedMinutesToday,
    user
  ]);

  const daysToEnem = getDaysToEnem();
  const visibleTabs = planTag === "ADM" ? [...tabs, adminTab] : tabs;

  function updateState(updater: (current: StudyState) => StudyState) {
    setState((current) => updater(current));
  }

  async function finishQuiz() {
    const profileKind = profileFromAnswers(answers);
    const dailyGoalMinutes = minutesFromStudyFrequency(answers.studyFrequency);
    const priority = prioritySubject(answers.area);
    const supabase = getSupabaseClient();

    if (!supabase || !user) return;

    setAccountLoading(true);
    const { error } = await supabase.rpc("complete_student_onboarding", {
      p_quiz_profile: profileKind,
      p_daily_goal_minutes: dailyGoalMinutes,
      p_target_exam_year: Number(answers.targetExam ?? "2026"),
      p_main_difficulty: answers.difficulty,
      p_priority_area: answers.area,
      p_essay_level: answers.level,
      p_study_frequency: answers.studyFrequency
    });

    if (error) {
      setAccountError("Não foi possível salvar seu diagnóstico. Tente novamente.");
      setAccountLoading(false);
      return;
    }

    updateState((current) => ({
      ...current,
      profileKind,
      dailyGoalMinutes,
      notifications: [
        `${priority} foi definida como sua primeira prioridade.`,
        ...current.notifications.slice(0, 2)
      ],
      topics: current.topics.map((topic) =>
        topic.subject === priority && topic.status === "Não iniciado"
          ? { ...topic, status: "Estudando" as const }
          : topic
      )
    }));
    setAccountLoading(false);
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setTransitionLabel("Encerrando sua sessão");
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const { error } = await supabase.auth.signOut();
    if (error) setTransitionLabel(null);
  }

  if (!localReady || authLoading) {
    return <LoadingScreen />;
  }

  if (transitionLabel) {
    return <BrandTransition />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={(nextUser) => beginSession(nextUser)} />;
  }

  if (accountLoading) {
    return <LoadingScreen />;
  }

  if (accountError) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5 text-white">
        <div className="glass max-w-md rounded-lg p-6 text-center">
          <p className="text-sm leading-6 text-slate-300">{accountError}</p>
          <GhostButton className="mt-5 w-full" onClick={() => setAccountReloadKey((key) => key + 1)}>
            Tentar novamente
          </GhostButton>
          <GhostButton className="mt-2 w-full" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            Encerrar sessão
          </GhostButton>
        </div>
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
          quizStep >= 4 ? void finishQuiz() : setQuizStep((step) => step + 1)
        }
        onBack={() => setQuizStep((step) => Math.max(0, step - 1))}
      />
    );
  }

  return (
    <main className="mission-grid min-h-screen bg-canvas text-white lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[0.08] bg-[#050b0d]/95 px-5 py-6 backdrop-blur-xl lg:flex">
        <div className="flex h-11 items-center">
          <Image
            src="/aprova-ai-logo-lockup.svg"
            alt="AprovaAI"
            width={640}
            height={220}
            priority
            className="h-10 w-auto max-w-full object-contain"
          />
        </div>

        <nav className="mt-10 grid gap-1.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === "home";
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition duration-150 ${
                  active
                    ? "bg-accent/10 text-white"
                    : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-aura" : ""}`} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">
            <ShieldCheck className="h-4 w-4 text-aura" />
            Perfil
          </p>
          <p className="mt-2 truncate text-sm text-slate-200">{user.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">plano</p>
              <p className="mt-1 text-sm text-aura">{formatPlanTag(planTag)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                <CreditCard className="h-3 w-3" /> créditos
              </p>
              <p className="mt-1 text-sm text-aura">{creditBalance ?? 0}</p>
            </div>
          </div>
          <GhostButton onClick={() => void handleSignOut()} className="mt-3 w-full">
            <LogOut className="h-4 w-4" />
            Sair
          </GhostButton>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <header className="mx-auto w-full max-w-7xl animate-float-in lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-40 items-center justify-center">
              <Image
                src="/aprova-ai-logo-lockup.svg"
                alt="AprovaAI"
                width={640}
                height={220}
                priority
                className="h-10 w-auto max-w-full object-contain"
              />
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300">
              {state.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto mt-5 w-full max-w-7xl lg:mt-0">
          <Dashboard
            user={user}
            planTag={planTag}
            creditBalance={creditBalance}
            onCreditBalanceChange={setCreditBalance}
            onSignOut={() => void handleSignOut()}
          />
        </div>
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div
          className="mx-auto grid max-w-lg gap-1"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === "home";
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`rounded-lg px-2 py-2 text-xs transition duration-300 ${
                  active ? "bg-accent/10 text-aura" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon className="mx-auto h-5 w-5" />
                <span className="mt-1 block">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5">
      <Loader size="lg" />
    </main>
  );
}

function formatPlanTag(planTag: PlanTag) {
  if (planTag === "ADM") return "ADM";
  return planTag === "premium" ? "Premium" : "Free";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}
