import type { MentorMessage, StudyState, TopicStatus } from "@/lib/types";
import { todayKey } from "@/lib/study-data";

export function normalizeDailyReset(state: StudyState): StudyState {
  const today = todayKey();
  if (state.lastProgressDate === today) return state;

  const studiedYesterday = state.studiedMinutesToday > 0;
  const currentStreak = studiedYesterday ? state.currentStreak + 1 : 0;

  return {
    ...state,
    studiedMinutesToday: 0,
    weeklyMinutes: [...state.weeklyMinutes.slice(1), 0],
    lastProgressDate: today,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    tasks: state.tasks.map((task) => ({ ...task, done: false })),
    notifications: studiedYesterday
      ? ["Você protegeu a sequência. Hoje é dia de subir mais um nível.", ...state.notifications.slice(0, 2)]
      : ["Você perdeu presença ontem. O sistema não pune: ele chama você de volta.", ...state.notifications.slice(0, 2)]
  };
}

export function toggleTask(state: StudyState, taskId: string): StudyState {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task || task.done) return state;

  const tasks = state.tasks.map((item) =>
    item.id === taskId ? { ...item, done: true } : item
  );
  const allDone = tasks.every((item) => item.done);

  return {
    ...state,
    tasks,
    xp: state.xp + task.xp + (allDone ? 35 : 0),
    completedTasks: state.completedTasks + 1,
    questionCount: taskId === "questions" ? state.questionCount + 10 : state.questionCount,
    currentStreak: allDone && state.currentStreak === 0 ? 1 : state.currentStreak,
    bestStreak: Math.max(state.bestStreak, allDone ? 1 : state.currentStreak),
    notifications: allDone
      ? ["Missão diária concluída. Você protegeu o dia.", ...state.notifications.slice(0, 2)]
      : state.notifications
  };
}

export function addMinutes(state: StudyState, minutes: number): StudyState {
  const newToday = state.studiedMinutesToday + minutes;
  const hitGoal =
    state.studiedMinutesToday < state.dailyGoalMinutes &&
    newToday >= state.dailyGoalMinutes;
  const weeklyMinutes = [...state.weeklyMinutes];
  weeklyMinutes[weeklyMinutes.length - 1] += minutes;

  return {
    ...state,
    studiedMinutesToday: newToday,
    totalMinutes: state.totalMinutes + minutes,
    weeklyMinutes,
    xp: state.xp + Math.round(minutes / 3) + (hitGoal ? 30 : 0),
    currentStreak: newToday > 0 && state.currentStreak === 0 ? 1 : state.currentStreak,
    bestStreak: Math.max(state.bestStreak, newToday > 0 ? 1 : state.currentStreak),
    notifications: hitGoal
      ? ["Meta diária batida. Isso é evidência, não promessa.", ...state.notifications.slice(0, 2)]
      : state.notifications
  };
}

export function changeTopicStatus(
  state: StudyState,
  topicId: string,
  status: TopicStatus
): StudyState {
  const current = state.topics.find((topic) => topic.id === topicId);
  const completedNow = current?.status !== "Concluído" && status === "Concluído";

  return {
    ...state,
    topics: state.topics.map((topic) =>
      topic.id === topicId ? { ...topic, status } : topic
    ),
    xp: state.xp + (completedNow ? 50 : 0)
  };
}

export function mentorReply(): MentorMessage {
  return {
    id: crypto.randomUUID(),
    role: "mentor",
    text: "Estratégia: defina o menor avanço verificável, execute sem negociar e registre o resultado. Amanhã o sistema recalibra pelo que você fez, não pelo que prometeu.",
    createdAt: new Date().toISOString()
  };
}