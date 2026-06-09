"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, BookOpen, Check, ChevronRight, Home, ImagePlus, Lock, MessageCircle, Plus, Sparkles, Target, Trophy } from "lucide-react";
import { Button, Card, GhostButton, ProgressBar, Stat } from "@/components/ui";
import { achievements, areas, dailyPhrases, difficulties, initialState, levels, metricValue, minutesFromStudyTime, prioritySubject, profileFromAnswers, rankFromXp, studyTimes, subjects, todayKey } from "@/lib/study-data";
import { loadLocalState, saveLocalState } from "@/lib/local-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { MentorMessage, QuizAnswers, StudyState, TopicStatus } from "@/lib/types";

const tabs = [
  { id: "home", label: "Hoje", icon: Home },
  { id: "subjects", label: "Temas", icon: BookOpen },
  { id: "progress", label: "Evolução", icon: BarChart3 },
  { id: "mentor", label: "Mentor", icon: MessageCircle }
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
    void supabase.auth.getSession().then(({ data }) => mounted && setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !state.profileKind) return;
    void Promise.all([
      supabase.from("profiles").upsert({ id: user.id, full_name: state.name, quiz_profile: state.profileKind, daily_goal_minutes: state.dailyGoalMinutes }),
      supabase.from("daily_progress").upsert({ user_id: user.id, progress_date: todayKey(), studied_minutes: state.studiedMinutesToday, tasks_completed: state.completedTasks, questions_answered: state.questionCount }, { onConflict: "user_id,progress_date" }),
      supabase.from("streaks").upsert({ user_id: user.id, current_streak: state.currentStreak, best_streak: state.bestStreak, last_study_date: state.studiedMinutesToday > 0 ? todayKey() : null }, { onConflict: "user_id" })
    ]);
  }, [user, state]);

  const phrase = dailyPhrases[new Date().getDate() % dailyPhrases.length];
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
      notifications: [`Seu foco inicial é ${priority}. Comece pequeno e marque presença hoje.`, ...current.notifications.slice(0, 2)],
      topics: current.topics.map((topic) => topic.subject === priority && topic.status === "Não iniciado" ? { ...topic, status: "Estudando" } : topic)
    }));
  }

  if (!ready) return <main className="flex min-h-screen items-center justify-center px-5"><Card className="w-full max-w-sm text-center"><Sparkles className="mx-auto h-8 w-8 text-ocean" /><p className="mt-3 font-bold">Preparando seu plano...</p></Card></main>;

  if (!state.profileKind) {
    return <Quiz answers={answers} step={quizStep} onAnswer={(next) => setAnswers((current) => ({ ...current, ...next }))} onNext={() => quizStep >= 3 ? finishQuiz() : setQuizStep((step) => step + 1)} onBack={() => setQuizStep((step) => Math.max(0, step - 1))} />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
      <header className="animate-float-in">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-ocean">Aprova.AI</p><h1 className="text-2xl font-black text-ink">Oi, {state.name}</h1></div>
          <Link href="/achievements" className="grid h-11 w-11 place-items-center rounded-lg border border-orange-100 bg-orange-50 text-reward shadow-sm" aria-label="Conquistas"><Trophy className="h-5 w-5" /></Link>
        </div>
        <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm font-semibold text-slate-700">“{phrase}”</p>
      </header>

      <div className="mt-5 animate-float-in">
        {activeTab === "home" && <Dashboard state={state} user={user} progressPercent={progressPercent} completedAchievements={completedAchievements.length} nextAchievementTitle={nextAchievement?.title ?? "Tudo desbloqueado"} onTaskToggle={(taskId) => updateState((current) => toggleTask(current, taskId))} onAddMinutes={(minutes) => updateState((current) => addMinutes(current, minutes))} onGoalChange={(minutes) => updateState((current) => ({ ...current, dailyGoalMinutes: minutes }))} onNameChange={(name) => updateState((current) => ({ ...current, name: name.trim() || "Estudante" }))} />}
        {activeTab === "subjects" && <Subjects state={state} onStatusChange={(topicId, status) => updateState((current) => changeTopicStatus(current, topicId, status))} />}
        {activeTab === "progress" && <Progress state={state} />}
        {activeTab === "mentor" && <Mentor messages={state.mentorMessages} onSend={(message) => updateState((current) => ({ ...current, mentorMessages: [...current.mentorMessages, message, mentorReply()] }))} />}
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/80 bg-white/85 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${active ? "bg-blue-50 text-ocean" : "text-slate-500"}`}><Icon className="mx-auto h-5 w-5" /><span className="mt-1 block">{tab.label}</span></button>;
          })}
        </div>
      </nav>
    </main>
  );
}

function Quiz({ answers, step, onAnswer, onNext, onBack }: { answers: QuizAnswers; step: number; onAnswer: (answer: QuizAnswers) => void; onNext: () => void; onBack: () => void }) {
  const screens = [
    { title: "Qual sua maior dificuldade?", options: difficulties, selected: answers.difficulty, select: (id: string) => onAnswer({ difficulty: id as QuizAnswers["difficulty"] }) },
    { title: "Quanto consegue estudar por dia?", options: studyTimes, selected: answers.studyTime, select: (id: string) => onAnswer({ studyTime: id as QuizAnswers["studyTime"] }) },
    { title: "Área com maior dificuldade?", options: areas, selected: answers.area, select: (id: string) => onAnswer({ area: id as QuizAnswers["area"] }) },
    { title: "Seu nível?", options: levels, selected: answers.level, select: (id: string) => onAnswer({ level: id as QuizAnswers["level"] }) }
  ];
  const screen = screens[step];
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      <div className="flex items-center justify-between"><p className="text-sm font-black text-ocean">Aprova.AI</p><p className="text-sm font-bold text-slate-500">{step + 1}/4</p></div>
      <ProgressBar value={((step + 1) / 4) * 100} className="mt-4" />
      <section className="mt-8 flex flex-1 flex-col"><p className="text-sm font-bold uppercase tracking-[0.12em] text-reward">Diagnóstico inicial</p><h1 className="mt-3 text-3xl font-black leading-tight text-ink">{screen.title}</h1>
        <div className="mt-6 grid gap-3">{screen.options.map((option) => <button key={option.id} onClick={() => screen.select(option.id)} className={`rounded-lg border p-4 text-left font-bold shadow-sm transition active:scale-[0.99] ${screen.selected === option.id ? "border-blue-500 bg-blue-50 text-blue-800" : "border-white bg-white/80 text-ink"}`}>{option.label}{"detail" in option && <span className="mt-1 block text-sm font-medium text-slate-500">{option.detail}</span>}</button>)}</div>
      </section>
      <div className="grid grid-cols-[0.7fr_1fr] gap-3"><GhostButton onClick={onBack} disabled={step === 0}>Voltar</GhostButton><Button onClick={onNext} disabled={!screen.selected}>{step === 3 ? "Gerar plano" : "Continuar"}<ChevronRight className="h-4 w-4" /></Button></div>
    </main>
  );
}

function Dashboard({ state, user, progressPercent, completedAchievements, nextAchievementTitle, onTaskToggle, onAddMinutes, onGoalChange, onNameChange }: { state: StudyState; user: User | null; progressPercent: number; completedAchievements: number; nextAchievementTitle: string; onTaskToggle: (taskId: string) => void; onAddMinutes: (minutes: number) => void; onGoalChange: (minutes: number) => void; onNameChange: (name: string) => void }) {
  return <div className="grid gap-4"><AuthCard user={user} /><Card><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-500">{state.profileKind}</p><h2 className="mt-1 text-xl font-black">Meta diária</h2></div><div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-black text-mint">{progressPercent}%</div></div><ProgressBar value={progressPercent} className="mt-4" /><div className="mt-4 grid grid-cols-2 gap-3"><Stat label="Hoje" value={`${Math.round((state.studiedMinutesToday / 60) * 10) / 10}h`} tone="green" /><Stat label="Meta" value={`${Math.round((state.dailyGoalMinutes / 60) * 10) / 10}h`} tone="blue" /></div><div className="mt-4 grid grid-cols-3 gap-2">{[15, 30, 60].map((minutes) => <GhostButton key={minutes} onClick={() => onAddMinutes(minutes)} className="px-2"><Plus className="h-4 w-4" />{minutes}m</GhostButton>)}</div><label className="mt-4 block text-sm font-bold text-slate-600">Horas por dia<input type="number" min={0.5} max={8} step={0.5} value={state.dailyGoalMinutes / 60} onChange={(event) => onGoalChange(Number(event.target.value) * 60)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-500" /></label></Card><section className="grid grid-cols-2 gap-3"><Stat label="Streak" value={`🔥 ${state.currentStreak}d`} tone="orange" /><Stat label="XP" value={`${state.xp}`} tone="purple" /><Stat label="Rank" value={rankFromXp(state.xp)} tone="blue" /><Stat label="Conquistas" value={`${completedAchievements}`} tone="green" /></section><Card><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black">Checklist diário</h2><Target className="h-5 w-5 text-ocean" /></div><div className="mt-3 grid gap-2">{state.tasks.map((task) => <button key={task.id} onClick={() => onTaskToggle(task.id)} className={`flex min-h-12 items-center justify-between rounded-lg border px-3 text-left transition ${task.done ? "border-green-100 bg-green-50 text-green-800" : "border-slate-100 bg-white/80 text-ink"}`}><span className="font-bold">{task.title}</span><span className="grid h-7 w-7 place-items-center rounded-full bg-white">{task.done ? <Check className="h-4 w-4 text-mint" /> : `+${task.xp}`}</span></button>)}</div></Card><Card><h2 className="text-lg font-black">Alertas inteligentes</h2><div className="mt-3 grid gap-2">{state.notifications.map((notification) => <p key={notification} className="rounded-lg bg-orange-50 p-3 text-sm font-semibold text-orange-800">{notification}</p>)}</div></Card><Card><label className="text-sm font-bold text-slate-600">Nome na saudação<input defaultValue={state.name} onBlur={(event) => onNameChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-500" /></label><p className="mt-3 text-sm font-semibold text-slate-500">Próxima conquista: {nextAchievementTitle}</p></Card></div>;
}

function AuthCard({ user }: { user: User | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = getSupabaseClient();
  if (!supabase) return <Card><p className="text-sm font-bold text-slate-500">Supabase</p><h2 className="mt-1 text-lg font-black">Modo local ativo</h2><p className="mt-2 text-sm font-semibold text-slate-600">Configure as envs para ativar login e persistência no banco.</p></Card>;
  if (user) return <Card className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-green-700">Conectado ao Supabase</p><p className="truncate text-sm font-semibold text-slate-500">{user.email}</p></div><GhostButton onClick={() => void supabase.auth.signOut()} className="shrink-0">Sair</GhostButton></Card>;
  async function submit(mode: "login" | "signup") { if (!email.trim() || password.length < 6) { setMessage("Use e-mail válido e senha com pelo menos 6 caracteres."); return; } setSubmitting(true); const response = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setSubmitting(false); setMessage(response.error ? response.error.message : mode === "signup" ? "Cadastro criado. Confira seu e-mail se a confirmação estiver ativa." : "Login realizado."); }
  return <Card><p className="text-sm font-bold text-ocean">Conta</p><h2 className="mt-1 text-lg font-black">Salvar progresso na nuvem</h2><div className="mt-3 grid gap-2"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="email@exemplo.com" className="h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-blue-500" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Senha" className="h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-blue-500" /></div><div className="mt-3 grid grid-cols-2 gap-2"><Button disabled={submitting} onClick={() => void submit("login")}>Entrar</Button><GhostButton disabled={submitting} onClick={() => void submit("signup")}>Criar conta</GhostButton></div>{message && <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>}</Card>;
}

function Subjects({ state, onStatusChange }: { state: StudyState; onStatusChange: (topicId: string, status: TopicStatus) => void }) {
  return <div className="grid gap-4">{subjects.map((subject) => { const topics = state.topics.filter((topic) => topic.subject === subject); const done = topics.filter((topic) => topic.status === "Concluído").length; return <Card key={subject}><div className="flex items-center justify-between"><h2 className="text-lg font-black">{subject}</h2><span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-ocean">{done}/{topics.length}</span></div><div className="mt-3 grid gap-3">{topics.map((topic) => <div key={topic.id} className="rounded-lg border border-slate-100 bg-white/80 p-3"><p className="font-bold">{topic.title}</p><select value={topic.status} onChange={(event) => onStatusChange(topic.id, event.target.value as TopicStatus)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"><option>Não iniciado</option><option>Estudando</option><option>Concluído</option></select></div>)}</div></Card>; })}</div>;
}

function Progress({ state }: { state: StudyState }) {
  const max = Math.max(...state.weeklyMinutes, 60);
  const thisWeek = state.weeklyMinutes.reduce((sum, item) => sum + item, 0);
  const previousWeek = Math.max(1, Math.round(thisWeek * 0.78));
  const growth = Math.round(((thisWeek - previousWeek) / previousWeek) * 100);
  const concluded = state.topics.filter((topic) => topic.status === "Concluído").length;
  return <div className="grid gap-4"><Card><p className="text-sm font-bold text-ocean">Veja sua evolução</p><h2 className="mt-1 text-2xl font-black">Você está realmente avançando.</h2><div className="mt-4 grid grid-cols-2 gap-3"><Stat label="Total" value={`${Math.round(state.totalMinutes / 60)}h`} tone="blue" /><Stat label="Semana" value={`${Math.round((thisWeek / 60) * 10) / 10}h`} tone="green" /><Stat label="Mês" value={`${Math.round((state.totalMinutes / 60) * 10) / 10}h`} tone="purple" /><Stat label="Temas" value={`${concluded}`} tone="orange" /></div></Card><Card><div className="flex items-center justify-between"><h2 className="text-lg font-black">Evolução semanal</h2><span className="rounded-lg bg-green-50 px-2 py-1 text-sm font-black text-mint">+{growth}%</span></div><div className="mt-4 flex h-36 items-end gap-2">{state.weeklyMinutes.map((minutes, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-gradient-to-t from-ocean to-mint" style={{ height: `${Math.max(8, (minutes / max) * 100)}%` }} /><span className="text-xs font-bold text-slate-500">{["S", "T", "Q", "Q", "S", "S", "D"][index]}</span></div>)}</div></Card><Card><h2 className="text-lg font-black">Calendário de consistência</h2><div className="mt-3 grid grid-cols-7 gap-2">{Array.from({ length: 28 }).map((_, index) => <div key={index} className={`aspect-square rounded-md ${index < Math.min(28, state.currentStreak + 8) ? "bg-green-400" : "bg-slate-200"}`} />)}</div></Card></div>;
}

function Mentor({ messages, onSend }: { messages: MentorMessage[]; onSend: (message: MentorMessage) => void }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  return <div className="grid gap-4"><Card><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-ocean">Mentor ENEM</p><h2 className="text-xl font-black">Dúvida rápida</h2></div><span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-grape"><Sparkles className="h-5 w-5" /></span></div><div className="mt-4 grid gap-3">{messages.map((message) => <p key={message.id} className={`rounded-lg p-3 text-sm font-semibold ${message.role === "student" ? "bg-blue-50 text-blue-900" : "bg-white/80 text-slate-700"}`}>{message.text}{message.fileName && <span className="mt-2 block text-xs text-slate-500">Imagem: {message.fileName}</span>}</p>)}</div></Card><Card><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva sua dúvida..." className="min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:border-blue-500" /><div className="mt-3 flex items-center gap-2"><label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"><ImagePlus className="h-4 w-4" />Foto<input type="file" accept="image/*" className="hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name)} /></label><Button className="flex-1" onClick={() => { if (!text.trim() && !fileName) return; onSend({ id: crypto.randomUUID(), role: "student", text: text.trim() || "Enviei uma imagem da questão.", fileName, createdAt: new Date().toISOString() }); setText(""); setFileName(undefined); }}>Enviar</Button></div><p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500"><Lock className="h-4 w-4 text-reward" />Premium libera mentor IA completo e análises extras.</p></Card></div>;
}

function normalizeDailyReset(state: StudyState): StudyState { const today = todayKey(); if (state.lastProgressDate === today) return state; const studiedYesterday = state.studiedMinutesToday > 0; const currentStreak = studiedYesterday ? state.currentStreak + 1 : 0; return { ...state, studiedMinutesToday: 0, weeklyMinutes: [...state.weeklyMinutes.slice(1), 0], lastProgressDate: today, currentStreak, bestStreak: Math.max(state.bestStreak, currentStreak), tasks: state.tasks.map((task) => ({ ...task, done: false })), notifications: studiedYesterday ? ["Hoje é dia de manter o streak vivo.", ...state.notifications.slice(0, 2)] : ["Você não estudou hoje. Seu streak está em risco.", ...state.notifications.slice(0, 2)] }; }
function toggleTask(state: StudyState, taskId: string): StudyState { const task = state.tasks.find((item) => item.id === taskId); if (!task || task.done) return state; const tasks = state.tasks.map((item) => item.id === taskId ? { ...item, done: true } : item); const allDone = tasks.every((item) => item.done); return { ...state, tasks, xp: state.xp + task.xp + (allDone ? 25 : 0), completedTasks: state.completedTasks + 1, questionCount: taskId === "questions" ? state.questionCount + 10 : state.questionCount, currentStreak: allDone && state.currentStreak === 0 ? 1 : state.currentStreak, bestStreak: Math.max(state.bestStreak, allDone ? 1 : state.currentStreak) }; }
function addMinutes(state: StudyState, minutes: number): StudyState { const newToday = state.studiedMinutesToday + minutes; const hitGoal = state.studiedMinutesToday < state.dailyGoalMinutes && newToday >= state.dailyGoalMinutes; const weeklyMinutes = [...state.weeklyMinutes]; weeklyMinutes[weeklyMinutes.length - 1] += minutes; return { ...state, studiedMinutesToday: newToday, totalMinutes: state.totalMinutes + minutes, weeklyMinutes, xp: state.xp + (hitGoal ? 25 : 0), notifications: hitGoal ? ["Meta diária concluída. Agora você protegeu o dia.", ...state.notifications.slice(0, 2)] : state.notifications }; }
function changeTopicStatus(state: StudyState, topicId: string, status: TopicStatus): StudyState { const current = state.topics.find((topic) => topic.id === topicId); const completedNow = current?.status !== "Concluído" && status === "Concluído"; return { ...state, topics: state.topics.map((topic) => topic.id === topicId ? { ...topic, status } : topic), xp: state.xp + (completedNow ? 50 : 0) }; }
function mentorReply(): MentorMessage { return { id: crypto.randomUUID(), role: "mentor", text: "Boa. Separe a dúvida em: conceito, dados do enunciado e primeira tentativa. Quando a IA estiver conectada, eu respondo com resolução passo a passo.", createdAt: new Date().toISOString() }; }
