export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type EssayCompetency = {
  score: number;
  analysis: string;
  justificativa?: string;
  evidencias?: string[];
  problemas_encontrados?: string[];
  como_melhorar?: string;
  exemplo_pratico?: string;
  exercicio_recomendado?: string;
};

export type CriticalExcerpt = {
  trecho: string;
  problema: string;
  impacto: string;
  melhoria_sugerida: string;
};

export type EssayReview = {
  type: "essay_review";
  estimatedScore: number;
  nota_total?: number;
  nota_competencia_1?: number;
  nota_competencia_2?: number;
  nota_competencia_3?: number;
  nota_competencia_4?: number;
  nota_competencia_5?: number;
  diagnostico_geral?: string;
  principais_erros?: string[];
  pontos_fortes?: string[];
  plano_de_melhoria?: string[];
  missao_de_hoje?: string[];
  erros_recorrentes?: string[];
  trechos_criticos?: CriticalExcerpt[];
  versao_melhorada_de_um_paragrafo?: string;
  proxima_tarefa_recomendada?: string;
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
