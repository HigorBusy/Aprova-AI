import type { EssayCompetency, EssayReview } from "@/lib/ai/types";

export type RawEssayCompetency = {
  score?: unknown;
  analysis?: unknown;
  justificativa?: unknown;
  problemas_encontrados?: unknown;
  como_melhorar?: unknown;
  exemplo_pratico?: unknown;
};

export type RawEssayReview = {
  type?: unknown;
  nota_total?: unknown;
  nota_competencia_1?: unknown;
  nota_competencia_2?: unknown;
  nota_competencia_3?: unknown;
  nota_competencia_4?: unknown;
  nota_competencia_5?: unknown;
  diagnostico_geral?: unknown;
  principais_erros?: unknown;
  pontos_fortes?: unknown;
  plano_de_melhoria?: unknown;
  missao_de_hoje?: unknown;
  versao_melhorada_de_um_paragrafo?: unknown;
  proxima_tarefa_recomendada?: unknown;
  estimatedScore?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  improvements?: unknown;
  summary?: unknown;
  competencies?: {
    c1?: RawEssayCompetency;
    c2?: RawEssayCompetency;
    c3?: RawEssayCompetency;
    c4?: RawEssayCompetency;
    c5?: RawEssayCompetency;
  };
};

export function normalizeEssayReview(raw: RawEssayReview, essay: string): EssayReview {
  const heuristics = inspectEssay(essay);
  const rawCompetencies = raw.competencies ?? {};

  let c1 = normalizeCompetency(rawCompetencies.c1, raw.nota_competencia_1, "C1");
  let c2 = normalizeCompetency(rawCompetencies.c2, raw.nota_competencia_2, "C2");
  let c3 = normalizeCompetency(rawCompetencies.c3, raw.nota_competencia_3, "C3");
  let c4 = normalizeCompetency(rawCompetencies.c4, raw.nota_competencia_4, "C4");
  let c5 = normalizeCompetency(rawCompetencies.c5, raw.nota_competencia_5, "C5");

  if (heuristics.shortOrSuperficial) {
    c2 = capCompetency(c2, 120, "Texto curto ou superficial nao sustenta nota alta em compreensao, repertorio e desenvolvimento.");
    c3 = capCompetency(c3, 120, "Argumentacao curta ou generica nao comprova a tese.");
  }

  if (!heuristics.hasRepertoire) {
    c2 = capCompetency(c2, 120, "Nao ha repertorio sociocultural real e produtivo no texto.");
  }

  if (!heuristics.hasIntervention) {
    c5 = capCompetency(c5, 120, "A proposta de intervencao nao aparece de forma completa.");
  }

  if (!heuristics.hasConnectiveVariety) {
    c4 = capCompetency(c4, 140, "A coesao esta limitada por poucos conectivos ou encadeamento fraco.");
  }

  let competencies = { c1, c2, c3, c4, c5 };
  let total = sumCompetencies(competencies);

  if (heuristics.shortOrSuperficial && total > 600) {
    competencies = scaleCompetenciesToCap(competencies, 600);
    total = sumCompetencies(competencies);
  }

  const principaisErros = asStringArray(raw.principais_erros ?? raw.weaknesses, [
    "Argumentos pouco desenvolvidos.",
    "Falta de repertorio produtivo.",
    "Proposta de intervencao incompleta."
  ]);
  const pontosFortes = asStringArray(raw.pontos_fortes ?? raw.strengths, ["Ha uma tentativa de organizar uma tese."]);
  const plano = asStringArray(raw.plano_de_melhoria ?? raw.improvements, [
    "Escreva uma tese mais precisa.",
    "Inclua um repertorio conectado ao tema.",
    "Monte uma proposta com agente, acao, meio, finalidade e detalhamento."
  ]);
  const missaoDeHoje = asStringArray(raw.missao_de_hoje, [
    "Reescrever a introducao com tese explicita.",
    "Adicionar um repertorio legitimo e conectado ao tema.",
    "Reescrever a proposta de intervencao com agente, acao, meio, finalidade e detalhamento."
  ]);
  const diagnostico = asString(raw.diagnostico_geral ?? raw.summary) ||
    "Sua redacao ainda esta em nivel basico: apresenta uma ideia geral, mas perde nota por falta de desenvolvimento, repertorio e intervencao completa.";

  return {
    type: "essay_review",
    estimatedScore: total,
    nota_total: total,
    nota_competencia_1: competencies.c1.score,
    nota_competencia_2: competencies.c2.score,
    nota_competencia_3: competencies.c3.score,
    nota_competencia_4: competencies.c4.score,
    nota_competencia_5: competencies.c5.score,
    diagnostico_geral: diagnostico,
    principais_erros: principaisErros,
    pontos_fortes: pontosFortes,
    plano_de_melhoria: plano,
    missao_de_hoje: missaoDeHoje,
    versao_melhorada_de_um_paragrafo: asString(raw.versao_melhorada_de_um_paragrafo) ||
      "Uma versao mais forte precisa apresentar a tese com clareza, conectar um repertorio real ao problema e explicar a consequencia social do tema antes de propor uma solucao.",
    proxima_tarefa_recomendada: asString(raw.proxima_tarefa_recomendada) ||
      "Reescreva um paragrafo de desenvolvimento com tese, repertorio, explicacao e fechamento.",
    competencies,
    strengths: pontosFortes,
    weaknesses: principaisErros,
    improvements: missaoDeHoje,
    summary: diagnostico
  };
}

function normalizeCompetency(raw: RawEssayCompetency | undefined, fallback: unknown, label: string): EssayCompetency {
  const score = clampScore(asNumber(raw?.score ?? fallback));
  const justificativa = asString(raw?.justificativa ?? raw?.analysis) || `${label}: analise nao detalhada pelo modelo.`;
  const problemas = asStringArray(raw?.problemas_encontrados, ["Problema especifico nao detalhado."]);
  const comoMelhorar = asString(raw?.como_melhorar) || "Reescreva o trecho deixando a ideia mais precisa e comprovada.";
  const exemplo = asString(raw?.exemplo_pratico) || "Exemplo: acrescente causa, consequencia e relacao direta com a tese.";

  return {
    score,
    justificativa,
    problemas_encontrados: problemas,
    como_melhorar: comoMelhorar,
    exemplo_pratico: exemplo,
    analysis: `${justificativa} Problemas: ${problemas.join(" ")} Como melhorar: ${comoMelhorar} Exemplo: ${exemplo}`
  };
}

function capCompetency(competency: EssayCompetency, cap: number, reason: string): EssayCompetency {
  if (competency.score <= cap) return competency;
  return {
    ...competency,
    score: cap,
    analysis: `${competency.analysis} Penalizacao aplicada: ${reason}`
  };
}

function scaleCompetenciesToCap(competencies: EssayReview["competencies"], cap: number) {
  const current = sumCompetencies(competencies);
  if (current <= cap) return competencies;
  const factor = cap / current;

  const scaled = {
    c1: { ...competencies.c1, score: roundToNearestTen(competencies.c1.score * factor) },
    c2: { ...competencies.c2, score: roundToNearestTen(competencies.c2.score * factor) },
    c3: { ...competencies.c3, score: roundToNearestTen(competencies.c3.score * factor) },
    c4: { ...competencies.c4, score: roundToNearestTen(competencies.c4.score * factor) },
    c5: { ...competencies.c5, score: roundToNearestTen(competencies.c5.score * factor) }
  };

  let excess = sumCompetencies(scaled) - cap;
  const order = ["c1", "c4", "c2", "c3", "c5"] as const;
  while (excess > 0) {
    for (const key of order) {
      if (excess <= 0) break;
      if (scaled[key].score >= 10) {
        scaled[key].score -= 10;
        excess -= 10;
      }
    }
  }

  return scaled;
}

function inspectEssay(essay: string) {
  const lower = essay.toLowerCase();
  const words = essay.split(/\s+/).filter(Boolean);
  const paragraphCount = essay.split(/\n+/).map((p) => p.trim()).filter(Boolean).length;
  const repertoireTerms = ["constituicao", "paulo freire", "bourdieu", "bauman", "milton santos", "hannah arendt", "ibge", "inep", "onu", "oms", "filosof", "sociolog"];
  const interventionTerms = ["governo", "estado", "ministerio", "escola", "sociedade", "familia", "midia", "ong", "deve", "por meio", "a fim de", "para que"];
  const connectiveTerms = ["alem disso", "portanto", "contudo", "entretanto", "desse modo", "por conseguinte", "nesse sentido", "assim", "dessa forma", "visto que"];

  return {
    shortOrSuperficial: words.length < 180 || paragraphCount < 3,
    hasRepertoire: repertoireTerms.some((term) => lower.includes(term)),
    hasIntervention: interventionTerms.filter((term) => lower.includes(term)).length >= 3,
    hasConnectiveVariety: connectiveTerms.filter((term) => lower.includes(term)).length >= 3
  };
}

function sumCompetencies(competencies: EssayReview["competencies"]) {
  return competencies.c1.score + competencies.c2.score + competencies.c3.score + competencies.c4.score + competencies.c5.score;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(200, roundToNearestTen(value)));
}

function roundToNearestTen(value: number) {
  return Math.round(value / 10) * 10;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map(asString).filter(Boolean);
  return items.length > 0 ? items : fallback;
}
