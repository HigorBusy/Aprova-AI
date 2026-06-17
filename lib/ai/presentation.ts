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
  mission?: string;
  speakerNotes?: string;
};

export type PresentationDeck = {
  type: "presentation";
  title: string;
  template: PresentationTemplate;
  objective: string;
  estimatedExecutionTime: string;
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
  "Erros comuns",
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
  return `Gere uma apresentacao personalizada para estudante do ENEM.

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
- A apresentacao deve parecer um mapa de execucao.
- Use exatamente 8 slides.
- Cada slide deve ter titulo, objetivo curto, bullets praticos e, quando fizer sentido, uma missao.
- Responda exclusivamente com JSON valido.

Formato obrigatorio:
{
  "type": "presentation",
  "title": "",
  "template": "${template}",
  "objective": "",
  "estimatedExecutionTime": "",
  "slides": [
    { "title": "Titulo e objetivo", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Diagnostico", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Prioridades", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Plano semanal", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Cronograma", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Erros comuns", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Missao pratica", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" },
    { "title": "Resumo executivo", "objective": "", "bullets": [""], "mission": "", "speakerNotes": "" }
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

    return {
      title: String(slide.title || title).trim().slice(0, 90),
      objective: String(slide.objective || "").trim().slice(0, 180),
      bullets: bullets.length > 0 ? bullets : ["Definir uma acao concreta para este ponto."],
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
