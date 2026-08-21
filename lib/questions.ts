export type QuestionAreaKey = "math" | "languages" | "humanities" | "nature";
export type QuestionMode = "quick" | "area" | "weakness" | "errors";
export type QuestionOption = "A" | "B" | "C" | "D" | "E";

export type QuestionAlternative = {
  key: QuestionOption;
  text: string;
};

export type QuestionAnswerResult = {
  isCorrect: boolean;
  selectedOption: QuestionOption;
  correctOption: QuestionOption;
  explanation: string;
  topicId?: string;
  topic?: string;
  discipline?: string;
  areaKey?: QuestionAreaKey;
};

export type TrainingQuestion = {
  id: string;
  position: number;
  areaKey: QuestionAreaKey;
  discipline: string;
  topicId: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  alternatives: QuestionAlternative[];
  sourceType: "official_enem" | "official_other" | "authored";
  sourceName: string;
  sourceYear: number | null;
  sourceReference: string;
  rightsNote: string;
  imageUrl: string | null;
  selectedOption: QuestionOption | null;
  markedReview: boolean;
  answeredAt: string | null;
  result: QuestionAnswerResult | null;
};

export type QuestionSession = {
  id: string;
  mode: QuestionMode;
  areaKey: QuestionAreaKey | null;
  status: "active" | "completed" | "abandoned";
  questionCount: number;
  correctCount: number;
  startedAt: string;
  completedAt: string | null;
  questions: TrainingQuestion[];
};

export type QuestionTopic = {
  id: string;
  areaKey: QuestionAreaKey;
  discipline: string;
  name: string;
  slug: string;
  questionCount: number;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
};

export type QuestionCatalog = {
  availableQuestions: number;
  errorCount: number;
  activeSessionId: string | null;
  topics: QuestionTopic[];
};

export type QuestionSessionSummary = {
  sessionId: string;
  total: number;
  answered: number;
  blank: number;
  correct: number;
  wrong: number;
  markedReview: number;
  accuracy: number;
};

export type QuestionErrorEntry = {
  questionId: string;
  areaKey: QuestionAreaKey;
  discipline: string;
  topicId: string;
  topic: string;
  prompt: string;
  alternatives: QuestionAlternative[];
  selectedOption: QuestionOption;
  correctOption: QuestionOption;
  explanation: string;
  answeredAt: string;
  attempts: number;
  wrongAttempts: number;
  accuracy: number;
};

export const questionAreas: Array<{ key: QuestionAreaKey; label: string; shortLabel: string }> = [
  { key: "math", label: "Matemática e suas Tecnologias", shortLabel: "Matemática" },
  { key: "languages", label: "Linguagens, Códigos e suas Tecnologias", shortLabel: "Linguagens" },
  { key: "humanities", label: "Ciências Humanas e suas Tecnologias", shortLabel: "Humanas" },
  { key: "nature", label: "Ciências da Natureza e suas Tecnologias", shortLabel: "Natureza" }
];

export function questionAreaLabel(areaKey: QuestionAreaKey | null | undefined) {
  return questionAreas.find((area) => area.key === areaKey)?.shortLabel ?? "Todas as áreas";
}

export function difficultyLabel(difficulty: TrainingQuestion["difficulty"]) {
  if (difficulty === "easy") return "Base";
  if (difficulty === "hard") return "Avançada";
  return "Intermediária";
}
