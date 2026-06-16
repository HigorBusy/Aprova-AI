import { getBrasiliaDateKey } from "@/lib/date-br";
import type {
  Achievement,
  Area,
  DailyTask,
  Difficulty,
  Level,
  ProfileKind,
  QuizAnswers,
  StudyState,
  StudyTime,
  Topic
} from "@/lib/types";

export const difficulties: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "start", label: "Preciso de uma rota inicial", detail: "O primeiro comando precisa ser claro." },
  { id: "routine", label: "Eu perco consistência", detail: "A nave precisa de sequência para chegar." },
  { id: "subjects", label: "Tenho setores fracos", detail: "Vamos revelar onde recalcular a rota." },
  { id: "motivation", label: "Eu desligo fácil", detail: "O sistema vai transformar presença em pilotagem." }
];

export const studyTimes: Array<{ id: StudyTime; label: string; minutes: number }> = [
  { id: "30m", label: "30 minutos de navegação real", minutes: 30 },
  { id: "1h", label: "1 hora de rota", minutes: 60 },
  { id: "2h", label: "2 horas de missão", minutes: 120 },
  { id: "3h", label: "3 horas ou mais de comando", minutes: 180 }
];

export const areas: Array<{ id: Area; label: string; subject: string }> = [
  { id: "math", label: "Matemática", subject: "Matemática" },
  { id: "essay", label: "Redação", subject: "Redação" },
  { id: "nature", label: "Natureza", subject: "Natureza" },
  { id: "humanities", label: "Humanas", subject: "Humanas" },
  { id: "languages", label: "Linguagens", subject: "Linguagens" }
];

export const levels: Array<{ id: Level; label: string }> = [
  { id: "zero", label: "Ainda estou na base de lançamento" },
  { id: "basic", label: "Tenho combustível, falta rota" },
  { id: "messy", label: "Tenho esforço, falta painel" },
  { id: "improve", label: "Quero pilotar em outro nível" }
];

export const dailyPhrases = ["Ninguém está vindo te salvar, então faça acontecer"];

export const subjects = ["Matemática", "Redação", "Linguagens", "Humanas", "Natureza"];

export const defaultTopics: Topic[] = [
  { id: "math-1", subject: "Matemática", title: "Razão, proporção e porcentagem", status: "Não iniciado" },
  { id: "math-2", subject: "Matemática", title: "Funções e leitura de gráficos", status: "Não iniciado" },
  { id: "essay-1", subject: "Redação", title: "Tese, repertório e projeto de texto", status: "Não iniciado" },
  { id: "essay-2", subject: "Redação", title: "Argumentação e intervenção", status: "Não iniciado" },
  { id: "lang-1", subject: "Linguagens", title: "Interpretação e intenção comunicativa", status: "Não iniciado" },
  { id: "hum-1", subject: "Humanas", title: "Brasil República e cidadania", status: "Não iniciado" },
  { id: "nat-1", subject: "Natureza", title: "Ecologia e ciclos biogeoquímicos", status: "Não iniciado" }
];

export const defaultTasks: DailyTask[] = [
  { id: "study-topic", title: "Avançar no setor prioritário", xp: 15, done: false },
  { id: "questions", title: "Resolver 10 sinais de prova", xp: 20, done: false },
  { id: "review", title: "Corrigir falhas de rota", xp: 15, done: false },
  { id: "log-hours", title: "Registrar tempo de navegação", xp: 10, done: false },
  { id: "note", title: "Salvar uma descoberta da missão", xp: 10, done: false }
];

export const achievements: Achievement[] = [
  { id: "first-task", title: "Primeiro comando", description: "Execute sua primeira ação de missão.", target: 1, metric: "tasks", rewardXp: 20, icon: "✓" },
  { id: "first-week", title: "Órbita estável", description: "Mantenha 7 dias seguidos de navegação.", target: 7, metric: "streak", rewardXp: 100, icon: "◆" },
  { id: "ten-hours", title: "Motores ativos", description: "Acumule 10 horas de voo.", target: 10, metric: "hours", rewardXp: 80, icon: "⚡" },
  { id: "thirty-hours", title: "Rota profunda", description: "Acumule 30 horas de missão.", target: 30, metric: "hours", rewardXp: 160, icon: "◇" },
  { id: "hundred-questions", title: "Radar calibrado", description: "Registre 100 questões vencidas.", target: 100, metric: "questions", rewardXp: 120, icon: "◎" }
];

export function todayKey(date = new Date()) {
  return getBrasiliaDateKey(date);
}

export function initialState(): StudyState {
  return {
    name: "Candidato",
    profileKind: null,
    dailyGoalMinutes: 60,
    studiedMinutesToday: 0,
    totalMinutes: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
    lastProgressDate: todayKey(),
    currentStreak: 0,
    bestStreak: 0,
    xp: 0,
    completedTasks: 0,
    questionCount: 0,
    topics: defaultTopics,
    tasks: defaultTasks,
    notifications: ["A nave está pronta. Falta o primeiro comando do dia."],
    mentorMessages: [
      {
        id: "welcome",
        role: "mentor",
        text: "Comandante IA em espera. Informe o bloqueio para recalcular a rota.",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function profileFromAnswers(answers: QuizAnswers): ProfileKind {
  if (answers.difficulty === "routine" || answers.level === "messy") return "Sem Rotina";
  if (answers.studyTime === "3h" || answers.level === "improve") return "Evolução Acelerada";
  if (answers.studyTime === "30m" && answers.level !== "zero") return "Última Hora";
  return "Iniciante Perdido";
}

export function minutesFromStudyTime(studyTime?: StudyTime) {
  return studyTimes.find((item) => item.id === studyTime)?.minutes ?? 60;
}

export function prioritySubject(area?: Area) {
  return areas.find((item) => item.id === area)?.subject ?? "Matemática";
}

export function rankFromXp(xp: number) {
  if (xp >= 3000) return "Lendário";
  if (xp >= 2200) return "Aprovado";
  if (xp >= 1500) return "Elite";
  if (xp >= 900) return "Competidor";
  if (xp >= 450) return "Estrategista";
  if (xp >= 120) return "Persistente";
  return "Sobrevivente";
}

export function metricValue(achievement: Achievement, state: StudyState) {
  if (achievement.metric === "tasks") return state.completedTasks;
  if (achievement.metric === "streak") return state.currentStreak;
  if (achievement.metric === "questions") return state.questionCount;
  return Math.floor(state.totalMinutes / 60);
}
