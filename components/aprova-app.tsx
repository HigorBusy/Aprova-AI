"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CreditCard, Home, LogOut, MessageCircle, ShieldCheck } from "lucide-react";

import { AuthScreen } from "@/components/auth-screen";
import { BrandTransition } from "@/components/brand-transition";
import { Copilot } from "@/components/copilot";
import { Dashboard } from "@/components/dashboard";
import { Quiz } from "@/components/quiz";
import { GhostButton } from "@/components/ui";
import { Loader } from "@/components/ui/loader-15";
import { getDaysToEnem } from "@/lib/constants";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import {
  dailyPhrases,
  initialState,
  minutesFromStudyTime,
  prioritySubject,
  profileFromAnswers,
  todayKey
} from "@/lib/study-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlanTag, ProfileKind, QuizAnswers, StudyState } from "@/lib/types";

const tabs = [
  { id: "home", label: "Central de controle", icon: Home },
  { id: "copilot", label: "Copiloto IA", icon: MessageCircle }
] as const;

type TabId = (typeof tabs)[number]["id"];

type ProfileRow = {
  full_name: string | null;
  name: string | null;
  quiz_profile: ProfileKind | null;
  daily_goal_minutes: number;
  plan_tag: PlanTag;
};

export function AprovaApp() {
  const [state, setState] = useState<StudyState>(() => initialState());
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizStep, setQuizStep] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("home");
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

  const beginSession = useCallback((nextUser: User, label = "Preparando sua Central") => {
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
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) beginSession(data.session.user, "Restaurando sua missão");
      else setAuthLoading(false);
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
        const [profileResult, creditsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name,name,quiz_profile,daily_goal_minutes,plan_tag")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>(),
          supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle()
        ]);

        if (profileResult.error || creditsResult.error) {
          throw profileResult.error ?? creditsResult.error;
        }
        if (!mounted) return;

        const profile = profileResult.data;
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

    void Promise.all([
      supabase.from("daily_progress").upsert(
        {
          user_id: user.id,
          progress_date: todayKey(),
          studied_minutes: state.studiedMinutesToday,
          tasks_completed: state.completedTasks,
          questions_answered: state.questionCount
        },
        { onConflict: "user_id,progress_date" }
      ),
      supabase.from("streaks").upsert(
        {
          user_id: user.id,
          current_streak: state.currentStreak,
          best_streak: state.bestStreak,
          last_study_date: state.studiedMinutesToday > 0 ? todayKey() : null
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

  const phrase = dailyPhrases[0];
  const daysToEnem = getDaysToEnem();

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

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setTransitionLabel("Encerrando sua missão");
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const { error } = await supabase.auth.signOut();
    if (error) setTransitionLabel(null);
  }

  if (!localReady || authLoading) {
    return <LoadingScreen label="Inicializando AprovaAI" />;
  }

  if (transitionLabel) {
    return <BrandTransition label={transitionLabel} />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={(nextUser) => beginSession(nextUser)} />;
  }

  if (accountLoading) {
    return <LoadingScreen label="Carregando perfil e créditos" />;
  }

  if (accountError) {
    return (
      <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5 text-white">
        <div className="glass max-w-md rounded-lg p-6 text-center">
          <p className="text-sm leading-6 text-slate-300">{accountError}</p>
          <GhostButton className="mt-5 w-full" onClick={() => setAccountReloadKey((key) => key + 1)}>
            Tentar novamente
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
        onNext={() => (quizStep >= 3 ? finishQuiz() : setQuizStep((step) => step + 1))}
        onBack={() => setQuizStep((step) => Math.max(0, step - 1))}
      />
    );
  }

  return (
    <main className="mission-grid min-h-screen bg-canvas text-white lg:grid lg:grid-cols-[284px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-black/40 px-5 py-6 backdrop-blur-2xl lg:flex">
        <Image
          src="/aprova-ai-glow.png"
          alt="AprovaAI"
          width={220}
          height={90}
          priority
          className="h-auto w-44 object-contain"
        />

        <p className="energy-text mt-5 rounded-lg border border-accent/20 bg-accent/[0.07] p-4 text-center text-sm font-medium leading-6 text-white">
          {phrase}
        </p>

        <nav className="mt-8 grid gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-left text-sm transition duration-300 ${
                  active
                    ? "border border-accent/25 bg-accent/10 text-aura shadow-[0_0_28px_rgba(124,58,237,0.14)]"
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
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">
            <ShieldCheck className="h-4 w-4 text-aura" />
            Perfil
          </p>
          <p className="mt-2 truncate text-sm text-slate-200">{user.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">plano</p>
              <p className="mt-1 text-sm text-aura">{planTag === "premium" ? "Premium" : "Free"}</p>
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
            <Image
              src="/aprova-ai-glow.png"
              alt="AprovaAI"
              width={170}
              height={70}
              priority
              className="h-auto w-36 object-contain"
            />
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300">
              {state.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <p className="energy-text mt-4 rounded-lg border border-accent/20 bg-accent/[0.07] p-3 text-center text-sm font-medium leading-6 text-white">
            {phrase}
          </p>
        </header>

        <div className="mx-auto mt-5 w-full max-w-7xl lg:mt-0">
          {activeTab === "home" && (
            <Dashboard
              state={state}
              user={user}
              planTag={planTag}
              creditBalance={creditBalance}
              onSignOut={() => void handleSignOut()}
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
                className={`rounded-lg px-2 py-2 text-xs transition duration-300 ${
                  active ? "bg-accent/10 text-aura" : "text-slate-500 hover:text-slate-200"
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

function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="mission-grid grid min-h-[100dvh] place-items-center bg-canvas px-5">
      <Loader size="lg" label={label} />
    </main>
  );
}
