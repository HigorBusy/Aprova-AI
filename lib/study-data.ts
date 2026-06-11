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
  { id: "routine", label: "Eu perco consistÃªncia", detail: "A nave precisa de sequÃªncia para chegar." },
  { id: "subjects", label: "Tenho setores fracos", detail: "Vamos revelar onde recalcular a rota." },
  { id: "motivation", label: "Eu desligo fÃ¡cil", detail: "O sistema vai transformar presenÃ§a em pilotagem." }
];

export const studyTimes: Array<{ id: StudyTime; label: string; minutes: number }> = [
  { id: "30m", label: "30 minutos de navegaÃ§Ã£o real", minutes: 30 },
  { id: "1h", label: "1 hora de rota", minutes: 60 },
  { id: "2h", label: "2 horas de missÃ£o", minutes: 120 },
  { id: "3h", label: "3 horas ou mais de comando", minutes: 180 }
];

export const areas: Array<{ id: Area; label: string; subject: string }> = [
  { id: "math", label: "MatemÃ¡tica", subject: "MatemÃ¡tica" },
  { id: "essay", label: "RedaÃ§Ã£o", subject: "RedaÃ§Ã£o" },
  { id: "nature", label: "Natureza", subject: "Natureza" },
  { id: "humanities", label: "Humanas", subject: "Humanas" },
  { id: "languages", label: "Linguagens", subject: "Linguagens" }
];

export const levels: Array<{ id: Level; label: string }> = [
  { id: "zero", label: "Ainda estou na base de lanÃ§amento" },
  { id: "basic", label: "Tenho combustÃ­vel, falta rota" },
  { id: "messy", label: "Tenho esforÃ§o, falta painel" },
  { id: "improve", label: "Quero pilotar em outro nÃ­vel" }
];

export const dailyPhrases = ["NinguÃ©m estÃ¡ vindo te salvar, entÃ£o faÃ§a acontecer"];

export const subjects = ["MatemÃ¡tica", "RedaÃ§Ã£o", "Linguagens", "Humanas", "Natureza"];

export const defaultTopics: Topic[] = [
  { id: "math-1", subject: "MatemÃ¡tica", title: "RazÃ£o, proporÃ§Ã£o e porcentagem", status: "NÃ£o iniciado" },
  { id: "math-2", subject: "MatemÃ¡tica", title: "FunÃ§Ãµes e leitura de grÃ¡ficos", status: "NÃ£o iniciado" },
  { id: "essay-1", subject: "RedaÃ§Ã£o", title: "Tese, repertÃ³rio e projeto de texto", status: "NÃ£o iniciado" },
  { id: "essay-2", subject: "RedaÃ§Ã£o", title: "ArgumentaÃ§Ã£o e intervenÃ§Ã£o", status: "NÃ£o iniciado" },
  { id: "lang-1", subject: "Linguagens", title: "InterpretaÃ§Ã£o e intenÃ§Ã£o comunicativa", status: "NÃ£o iniciado" },
  { id: "hum-1", subject: "Humanas", title: "Brasil RepÃºblica e cidadania", status: "NÃ£o iniciado" },
  { id: "nat-1", subject: "Natureza", title: "Ecologia e ciclos biogeoquÃ­micos", status: "NÃ£o iniciado" }
];

export const defaultTasks: DailyTask[] = [
  { id: "study-topic", title: "AvanÃ§ar no setor prioritÃ¡rio", xp: 15, done: false },
  { id: "questions", title: "Resolver 10 sinais de prova", xp: 20, done: false },
  { id: "review", title: "Corrigir falhas de rota", xp: 15, done: false },
  { id: "log-hours", title: "Registrar tempo de navegaÃ§Ã£o", xp: 10, done: false },
  { id: "note", title: "Salvar uma descoberta da missÃ£o", xp: 10, done: false }
];

export const achievements: Achievement[] = [
  { id: "first-task", title: "Primeiro comando", description: "Execute sua primeira aÃ§Ã£o de missÃ£o.", target: 1, metric: "tasks", rewardXp: 20, icon: "âœ“" },
  { id: "first-week", title: "Ã“rbita estÃ¡vel", description: "Mantenha 7 dias seguidos de navegaÃ§Ã£o.", target: 7, metric: "streak", rewardXp: 100, icon: "â—†" },
  { id: "ten-hours", title: "Motores ativos", description: "Acumule 10 horas de voo.", target: 10, metric: "hours", rewardXp: 80, icon: "âš¡" },
  { id: "thirty-hours", title: "Rota profunda", description: "Acumule 30 horas de missÃ£o.", target: 30, metric: "hours", rewardXp: 160, icon: "â—‡" },
  { id: "hundred-questions", title: "Radar calibrado", description: "Registre 100 questÃµes vencidas.", target: 100, metric: "questions", rewardXp: 120, icon: "â—Ž" }
];

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
    notifications: ["A nave estÃ¡ pronta. Falta o primeiro comando do dia."],
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
  if (answers.studyTime === "3h" || answers.level === "improve") return "EvoluÃ§Ã£o Acelerada";
  if (answers.studyTime === "30m" && answers.level !== "zero") return "Ãšltima Hora";
  return "Iniciante Perdido";
}

export function minutesFromStudyTime(studyTime?: StudyTime) {
  return studyTimes.find((item) => item.id === studyTime)?.minutes ?? 60;
}

export function prioritySubject(area?: Area) {
  return areas.find((item) => item.id === area)?.subject ?? "MatemÃ¡tica";
}

export function rankFromXp(xp: number) {
  if (xp >= 3000) return "LendÃ¡rio";
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
