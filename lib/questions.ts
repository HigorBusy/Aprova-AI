export type QuestionAreaKey = "math" | "languages" | "humanities" | "nature";
export type QuestionMode = "quick" | "area" | "weakness" | "errors" | "simulation";
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
  selectedAreas?: QuestionAreaKey[];
  timeLimitMinutes?: number | null;
  lastActivityAt?: string;
  endedReason?: "submitted" | "time_expired" | null;
  questions: TrainingQuestion[];
};

export type SimulationAreaResult = {
  areaKey: QuestionAreaKey;
  total: number;
  answered: number;
  correct: number;
  accuracy: number;
};

export type SimulationResult = QuestionSessionSummary & {
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  endedReason: "submitted" | "time_expired";
  byArea: SimulationAreaResult[];
  questions: TrainingQuestion[];
};

export type SimulationHistoryEntry = {
  sessionId: string;
  questionCount: number;
  correct: number;
  accuracy: number;
  answered: number;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  selectedAreas: QuestionAreaKey[];
  endedReason: "submitted" | "time_expired";
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

const officialSourceUrls = {
  "ENEM-2024-D1-AZUL": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D1_CD1.pdf",
  "ENEM-2024-D1-AMARELO": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D1_CD2.pdf",
  "ENEM-2024-D2-AZUL": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD7.pdf",
  "INEP-CARTILHA-2025": "https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2025_cartilha_do_participante.pdf",
  "APROVA-MATRIZ": "https://download.inep.gov.br/enem/outros_documentos/enem_matriz_referencia.pdf"
} as const;

export function questionSourceUrl(question: Pick<TrainingQuestion, "sourceReference">) {
  const match = Object.entries(officialSourceUrls).find(([prefix]) => question.sourceReference.startsWith(prefix));
  return match?.[1] ?? "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos";
}

export function questionSourceLabel(question: Pick<TrainingQuestion, "sourceType">) {
  if (question.sourceType === "official_enem") return "Questão oficial";
  if (question.sourceType === "official_other") return "Base oficial INEP";
  return "Questão autoral";
}

export function questionOriginalNumber(question: Pick<TrainingQuestion, "sourceReference">) {
  return question.sourceReference.match(/-Q(\d+)$/)?.[1] ?? null;
}
