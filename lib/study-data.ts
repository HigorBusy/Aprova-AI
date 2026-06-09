import type { Achievement, Area, DailyTask, Difficulty, Level, ProfileKind, QuizAnswers, StudyState, StudyTime, Topic } from "@/lib/types";

export const difficulties: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "start", label: "😵 Não sei por onde começar", detail: "Clareza para o primeiro passo." },
  { id: "routine", label: "⏰ Falta rotina", detail: "Consistência diária acima de intensidade." },
  { id: "subjects", label: "📚 Dificuldade em várias matérias", detail: "Blocos pequenos por assunto." },
  { id: "motivation", label: "🧠 Desanimo rápido", detail: "Progresso visível e recompensas." }
];

export const studyTimes: Array<{ id: StudyTime; label: string; minutes: number }> = [
  { id: "30m", label: "⏱️ 30 minutos", minutes: 30 },
  { id: "1h", label: "🕐 1 hora", minutes: 60 },
  { id: "2h", label: "🕑 2 horas", minutes: 120 },
  { id: "3h", label: "🔥 3 horas+", minutes: 180 }
];

export const areas: Array<{ id: Area; label: string; subject: string }> = [
  { id: "math", label: "🔢 Matemática", subject: "Matemática" },
  { id: "essay", label: "✍️ Redação", subject: "Redação" },
  { id: "nature", label: "🧬 Natureza", subject: "Natureza" },
  { id: "humanities", label: "🌍 Humanas", subject: "Humanas" },
  { id: "languages", label: "📖 Linguagens", subject: "Linguagens" }
];

export const levels: Array<{ id: Level; label: string }> = [
  { id: "zero", label: "🌱 Começando do zero" },
  { id: "basic", label: "🧱 Sei o básico" },
  { id: "messy", label: "⚡ Estudo sem organização" },
  { id: "improve", label: "🎯 Quero melhorar" }
];

export const dailyPhrases = [
  "Você não precisa estar motivado. Precisa cumprir.",
  "Quem vence o ENEM não espera vontade.",
  "Hoje é mais um dia para ficar menos perdido."
];

export const subjects = ["Matemática", "Redação", "Linguagens", "Humanas", "Natureza"];

export const defaultTopics: Topic[] = [
  { id: "math-1", subject: "Matemática", title: "Razão, proporção e porcentagem", status: "Não iniciado" },
  { id: "math-2", subject: "Matemática", title: "Funções e gráficos", status: "Não iniciado" },
  { id: "essay-1", subject: "Redação", title: "Repertório, tese e proposta", status: "Não iniciado" },
  { id: "lang-1", subject: "Linguagens", title: "Interpretação de textos", status: "Não iniciado" },
  { id: "hum-1", subject: "Humanas", title: "Brasil República", status: "Não iniciado" },
  { id: "nat-1", subject: "Natureza", title: "Ecologia e ciclos", status: "Não iniciado" }
];

export const defaultTasks: DailyTask[] = [
  { id: "study-topic", title: "Estudar tema", xp: 10, done: false },
  { id: "questions", title: "Resolver questões", xp: 10, done: false },
  { id: "review", title: "Revisar erros", xp: 10, done: false },
  { id: "log-hours", title: "Registrar horas", xp: 10, done: false },
  { id: "note", title: "Fazer anotação", xp: 10, done: false }
];

export const achievements: Achievement[] = [
  { id: "first-task", title: "Primeira tarefa", description: "Conclua uma tarefa diária.", target: 1, metric: "tasks", rewardXp: 20, icon: "✅" },
  { id: "first-week", title: "Primeira semana", description: "Mantenha 7 dias de sequência.", target: 7, metric: "streak", rewardXp: 100, icon: "🔥" },
  { id: "ten-hours", title: "10 horas", description: "Acumule 10 horas de estudo.", target: 10, metric: "hours", rewardXp: 80, icon: "⏳" },
  { id: "thirty-hours", title: "30 horas", description: "Acumule 30 horas de estudo.", target: 30, metric: "hours", rewardXp: 160, icon: "🚀" },
  { id: "hundred-questions", title: "100 questões", description: "Registre 100 questões resolvidas.", target: 100, metric: "questions", rewardXp: 120, icon: "🎯" }
];

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function initialState(): StudyState {
  return {
    name: "Estudante",
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
    notifications: ["Faltam poucos minutos para bater sua meta de hoje."],
    mentorMessages: [{ id: "welcome", role: "mentor", text: "Manda sua dúvida ou uma foto da questão. Por enquanto sou um mentor placeholder.", createdAt: new Date().toISOString() }]
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
  if (xp >= 2200) return "Lendário";
  if (xp >= 1400) return "Elite ENEM";
  if (xp >= 850) return "Avançado";
  if (xp >= 420) return "Focado";
  if (xp >= 120) return "Constante";
  return "Iniciante";
}

export function metricValue(achievement: Achievement, state: StudyState) {
  if (achievement.metric === "tasks") return state.completedTasks;
  if (achievement.metric === "streak") return state.currentStreak;
  if (achievement.metric === "questions") return state.questionCount;
  return Math.floor(state.totalMinutes / 60);
}
