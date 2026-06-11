export type Difficulty = "start" | "routine" | "subjects" | "motivation";
export type StudyTime = "30m" | "1h" | "2h" | "3h";
export type Area = "math" | "essay" | "nature" | "humanities" | "languages";
export type Level = "zero" | "basic" | "messy" | "improve";

export type QuizAnswers = {
  difficulty?: Difficulty;
  studyTime?: StudyTime;
  area?: Area;
  level?: Level;
};

export type ProfileKind = "Iniciante Perdido" | "Sem Rotina" | "Evolução Acelerada" | "Última Hora";
export type TopicStatus = "Não iniciado" | "Estudando" | "Concluído";
export type PlanTag = "free" | "premium";

export type Topic = {
  id: string;
  subject: string;
  title: string;
  status: TopicStatus;
};

export type DailyTask = {
  id: string;
  title: string;
  xp: number;
  done: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: "tasks" | "streak" | "hours" | "questions";
  rewardXp: number;
  icon: string;
};

export type MentorMessage = {
  id: string;
  role: "student" | "mentor";
  text: string;
  fileName?: string;
  createdAt: string;
};

export type StudyState = {
  name: string;
  profileKind: ProfileKind | null;
  dailyGoalMinutes: number;
  studiedMinutesToday: number;
  totalMinutes: number;
  weeklyMinutes: number[];
  lastProgressDate: string;
  currentStreak: number;
  bestStreak: number;
  xp: number;
  completedTasks: number;
  questionCount: number;
  topics: Topic[];
  tasks: DailyTask[];
  notifications: string[];
  mentorMessages: MentorMessage[];
};
