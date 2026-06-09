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
  { id: "start", label: "Preciso de um ponto de partida", detail: "O primeiro avanço precisa ser óbvio." },
  { id: "routine", label: "Eu perco consistência", detail: "Seu sistema precisa proteger a sequência." },
  { id: "subjects", label: "Tenho territórios fracos", detail: "Vamos expor onde atacar primeiro." },
  { id: "motivation", label: "Eu negocio com a procrastinação", detail: "O app vai transformar presença em identidade." }
];

export const studyTimes: Array<{ id: StudyTime; label: string; minutes: number }> = [
  { id: "30m", label: "30 minutos de presença real", minutes: 30 },
  { id: "1h", label: "1 hora de avanço", minutes: 60 },
  { id: "2h", label: "2 horas de campanha", minutes: 120 },
  { id: "3h", label: "3 horas ou mais de domínio", minutes: 180 }
];

export const areas: Array<{ id: Area; label: string; subject: string }> = [
  { id: "math", label: "Matemática", subject: "Matemática" },
  { id: "essay", label: "Redação", subject: "Redação" },
  { id: "nature", label: "Natureza", subject: "Natureza" },
  { id: "humanities", label: "Humanas", subject: "Humanas" },
  { id: "languages", label: "Linguagens", subject: "Linguagens" }
];

export const levels: Array<{ id: Level; label: string }> = [
  { id: "zero", label: "Ainda estou no começo" },
  { id: "basic", label: "Tenho base, falta direção" },
  { id: "messy", label: "Tenho esforço, falta sistema" },
  { id: "improve", label: "Quero competir em outro nível" }
];

export const dailyPhrases = [
  "A concorrência está estudando agora.",
  "Seu futuro não liga para sua motivação.",
  "Hoje é um dia que não volta.",
  "Quem passa não negocia com a procrastinação.",
  "A aprovação não premia intenção. Premia repetição.",
  "Você não precisa se sentir pronto para agir como aprovado."
];

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
  { id: "study-topic", title: "Avançar no território prioritário", xp: 15, done: false },
  { id: "questions", title: "Vencer 10 questões", xp: 20, done: false },
  { id: "review", title: "Corrigir os próprios erros", xp: 15, done: false },
  { id: "log-hours", title: "Registrar presença real", xp: 10, done: false },
  { id: "note", title: "Consolidar uma descoberta", xp: 10, done: false }
];

export const achievements: Achievement[] = [
  { id: "first-task", title: "Primeiro avanço", description: "Execute sua primeira ação de missão.", target: 1, metric: "tasks", rewardXp: 20, icon: "✓" },
  { id: "first-week", title: "Sequência protegida", description: "Mantenha 7 dias seguidos de presença.", target: 7, metric: "streak", rewardXp: 100, icon: "🔥" },
  { id: "ten-hours", title: "Motor ligado", description: "Acumule 10 horas de avanço.", target: 10, metric: "hours", rewardXp: 80, icon: "⚡" },
  { id: "thirty-hours", title: "Modo competição", description: "Acumule 30 horas de campanha.", target: 30, metric: "hours", rewardXp: 160, icon: "◆" },
  { id: "hundred-questions", title: "Pressão aplicada", description: "Registre 100 questões vencidas.", target: 100, metric: "questions", rewardXp: 120, icon: "◎" }
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
    weeklyMinutes: [20, 45, 0, 80, 60, 30, 0],
    lastProgressDate: todayKey(),
    currentStreak: 0,
    bestStreak: 0,
    xp: 0,
    completedTasks: 0,
    questionCount: 0,
    topics: defaultTopics,
    tasks: defaultTasks,
    notifications: ["A missão de hoje ainda está aberta. Feche o dia antes que ele feche você."],
    mentorMessages: [
      {
        id: "welcome",
        role: "mentor",
        text: "Relate seu bloqueio. Eu vou devolver uma estratégia de avanço, não uma resposta pronta.",
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