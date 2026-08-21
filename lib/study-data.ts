import { getBrasiliaDateKey } from "@/lib/date-br";
import type {
  Achievement,
  Area,
  DailyTask,
  Difficulty,
  Level,
  ProfileKind,
  QuizAnswers,
  StudyFrequency,
  StudyState,
  TargetExam,
  Topic
} from "@/lib/types";

export const targetExams: Array<{ id: TargetExam; label: string; detail: string }> = [
  { id: "2026", label: "ENEM 2026", detail: "Quero melhorar meu desempenho nesta edição." },
  { id: "2027", label: "ENEM 2027", detail: "Estou construindo uma preparação de longo prazo." }
];

export const difficulties: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "start", label: "Não sei por onde começar", detail: "Preciso de uma primeira ação clara." },
  { id: "routine", label: "Não consigo manter uma rotina", detail: "Começo, paro e perco consistência." },
  { id: "subjects", label: "Tenho matérias muito fracas", detail: "Preciso descobrir o que priorizar." },
  { id: "motivation", label: "Procrastino mais do que deveria", detail: "Sei que preciso estudar, mas não executo." }
];

export const studyFrequencies: Array<{ id: StudyFrequency; label: string; minutes: number }> = [
  { id: "1-2", label: "1 ou 2 dias por semana", minutes: 45 },
  { id: "3-4", label: "3 ou 4 dias por semana", minutes: 60 },
  { id: "5-7", label: "5 dias ou mais", minutes: 90 }
];

export const areas: Array<{ id: Area; label: string; subject: string }> = [
  { id: "math", label: "Matemática", subject: "Matemática" },
  { id: "essay", label: "Redação", subject: "Redação" },
  { id: "nature", label: "Natureza", subject: "Natureza" },
  { id: "humanities", label: "Humanas", subject: "Humanas" },
  { id: "languages", label: "Linguagens", subject: "Linguagens" }
];

export const levels: Array<{ id: Level; label: string }> = [
  { id: "zero", label: "Ainda não consigo estruturar uma redação" },
  { id: "basic", label: "Escrevo, mas geralmente fico abaixo de 600" },
  { id: "messy", label: "Fico entre 600 e 800, sem consistência" },
  { id: "improve", label: "Já passo de 800 e quero refinar" }
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
    notifications: ["Seu diagnóstico começa com a primeira atividade."],
    mentorMessages: [
      {
        id: "welcome",
        role: "mentor",
        text: "Tutor IA disponível. Conte sua dificuldade para receber um próximo passo claro.",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function profileFromAnswers(answers: QuizAnswers): ProfileKind {
  if (answers.difficulty === "routine" || answers.level === "messy") return "Sem Rotina";
  if (answers.studyFrequency === "5-7" || answers.level === "improve") return "Evolução Acelerada";
  if (answers.targetExam === "2026" && answers.studyFrequency === "1-2") return "Última Hora";
  return "Iniciante Perdido";
}

export function minutesFromStudyFrequency(frequency?: StudyFrequency) {
  return studyFrequencies.find((item) => item.id === frequency)?.minutes ?? 60;
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
