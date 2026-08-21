export type PresentationTemplate =
  | "Plano de Estudos"
  | "Evolucao da Redacao"
  | "Recuperacao de Competencias"
  | "Cronograma ENEM"
  | "Estrategia de Aprovacao"
  | "Revisao Final"
  | "Plano Intensivo";

export type PresentationSlide = {
  title: string;
  objective?: string;
  bullets: string[];
  insight?: string;
  actionSteps?: string[];
  checkpoint?: string;
  mission?: string;
  speakerNotes?: string;
};

export type PresentationDeck = {
  type: "presentation";
  title: string;
  template: PresentationTemplate;
  objective: string;
  estimatedExecutionTime: string;
  executiveSummary?: string;
  keyMetrics?: string[];
  milestones?: string[];
  slides: PresentationSlide[];
  nextAction: string;
};

export const PRESENTATION_COST = 10;

export const presentationTemplates: PresentationTemplate[] = [
  "Plano de Estudos",
  "Evolucao da Redacao",
  "Recuperacao de Competencias",
  "Cronograma ENEM",
  "Estrategia de Aprovacao",
  "Revisao Final",
  "Plano Intensivo"
];

const slideTitles = [
  "Titulo e objetivo",
  "Diagnostico",
  "Prioridades",
  "Plano semanal",
  "Cronograma",
  "Blocos de estudo",
  "Erros comuns",
  "Redacao e repertorio",
  "Missao pratica",
  "Resumo executivo"
];

export function buildPresentationPrompt({
  request,
  template,
  course,
  examDate,
  hoursPerDay,
  difficultSubjects
}: {
  request: string;
  template: PresentationTemplate;
  course: string;
  examDate: string;
  hoursPerDay: string;
  difficultSubjects: string;
}) {
  return `Gere uma apresentacao premium, robusta e personalizada para estudante do ENEM.

Pedido original:
${request}

Template escolhido:
${template}

Contexto informado:
- Curso desejado: ${course || "nao informado"}
- Data da prova/meta: ${examDate || "nao informado"}
- Horas por dia: ${hoursPerDay || "nao informado"}
- Materias ou competencias mais dificeis: ${difficultSubjects || "nao informado"}

Regras:
- Entregue um plano aplicavel, nao uma resposta generica.
- Use linguagem firme, humana e estrategica.
- Nao prometa aprovacao.
- Seja especifico para ENEM e redacao quando fizer sentido.
- A apresentacao deve parecer um mapa de execucao profissional, nao uma resposta de chat.
- Use exatamente 10 slides.
- Cada slide deve ter titulo forte, objetivo curto, insight, bullets praticos, actionSteps, checkpoint e, quando fizer sentido, uma missao.
- Crie uma narrativa com diagnostico, decisao, execucao e controle.
- Inclua checkpoints mensuraveis e tarefas praticas.
- Se faltar informacao do aluno, assuma um cenario conservador e explique isso no diagnostico.
- Evite conselhos vagos como "estude mais". Use acoes observaveis.
- Responda exclusivamente com JSON valido.

Formato obrigatorio:
{
  "type": "presentation",
  "title": "",
  "template": "${template}",
  "objective": "",
  "estimatedExecutionTime": "",
  "executiveSummary": "",
  "keyMetrics": ["", "", ""],
  "milestones": ["", "", ""],
  "slides": [
    { "title": "Titulo e objetivo", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Diagnostico", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Prioridades", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Plano semanal", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Cronograma", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Blocos de estudo", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Erros comuns", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Redacao e repertorio", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Missao pratica", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" },
    { "title": "Resumo executivo", "objective": "", "insight": "", "bullets": [""], "actionSteps": [""], "checkpoint": "", "mission": "", "speakerNotes": "" }
  ],
  "nextAction": ""
}`;
}

export function normalizePresentationDeck(raw: Partial<PresentationDeck>, fallbackTemplate: PresentationTemplate): PresentationDeck {
  const template = presentationTemplates.includes(raw.template as PresentationTemplate)
    ? raw.template as PresentationTemplate
    : fallbackTemplate;

  const rawSlides = Array.isArray(raw.slides) ? raw.slides : [];
  const slides = slideTitles.map((title, index) => {
    const slide = rawSlides[index] ?? {};
    const bullets = Array.isArray(slide.bullets)
      ? slide.bullets.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 6)
      : [];
    const actionSteps = Array.isArray(slide.actionSteps)
      ? slide.actionSteps.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 4)
      : [];

    return {
      title: String(slide.title || title).trim().slice(0, 90),
      objective: String(slide.objective || "").trim().slice(0, 180),
      insight: String(slide.insight || "").trim().slice(0, 220),
      bullets: bullets.length > 0 ? bullets : ["Definir uma acao concreta para este ponto."],
      actionSteps: actionSteps.length > 0 ? actionSteps : ["Executar uma tarefa mensuravel hoje."],
      checkpoint: String(slide.checkpoint || "").trim().slice(0, 180),
      mission: String(slide.mission || "").trim().slice(0, 220),
      speakerNotes: String(slide.speakerNotes || "").trim().slice(0, 500)
    };
  });

  return {
    type: "presentation",
    title: String(raw.title || template).trim().slice(0, 120),
    template,
    objective: String(raw.objective || "Transformar o pedido em um plano executavel.").trim().slice(0, 220),
    estimatedExecutionTime: String(raw.estimatedExecutionTime || "7 dias").trim().slice(0, 80),
    executiveSummary: String(raw.executiveSummary || "Plano gerado para transformar uma meta ampla em execucao diaria.").trim().slice(0, 360),
    keyMetrics: Array.isArray(raw.keyMetrics)
      ? raw.keyMetrics.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 4)
      : ["Redacoes corrigidas", "Horas de estudo", "Erros repetidos"],
    milestones: Array.isArray(raw.milestones)
      ? raw.milestones.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : ["Executar a primeira missao", "Revisar resultados", "Ajustar rota"],
    slides,
    nextAction: String(raw.nextAction || "Executar a primeira missao hoje.").trim().slice(0, 220)
  };
}

export function isComplexPresentationRequest(text: string) {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return [
    "plano de estudo",
    "plano de estudos",
    "cronograma",
    "estrategia",
    "preparacao enem",
    "revisao",
    "recuperar nota",
    "recuperacao",
    "sair de",
    "melhorar minha redacao",
    "como melhorar minha redacao"
  ].some((term) => normalized.includes(term));
}
