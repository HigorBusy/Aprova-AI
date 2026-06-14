export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type EssayCompetency = {
  score: number;
  analysis: string;
};

export type EssayReview = {
  type: "essay_review";
  estimatedScore: number;
  competencies: {
    c1: EssayCompetency;
    c2: EssayCompetency;
    c3: EssayCompetency;
    c4: EssayCompetency;
    c5: EssayCompetency;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
};
