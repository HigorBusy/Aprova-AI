export const slideTypes = [
  "cover",
  "section",
  "text_image",
  "comparison",
  "timeline",
  "process",
  "data",
  "chart",
  "quote",
  "conclusion",
  "call_to_action"
] as const;

export type SlideType = typeof slideTypes[number];

export type PresentationPlanSlide = {
  id: string;
  order: number;
  type: SlideType;
  title: string;
  purpose: string;
};

export type PresentationPlan = {
  ready: boolean;
  title: string;
  audience: string;
  objective: string;
  tone: string;
  theme: string;
  durationMinutes: number;
  narrative: string;
  clarificationQuestions: string[];
  slides: PresentationPlanSlide[];
};

export type PresentationVisual = {
  layout: string;
  imageSuggestion: string;
  emphasis: string;
};

export type PresentationStudioSlide = {
  id: string;
  order: number;
  type: SlideType;
  title: string;
  subtitle: string;
  body: string[];
  visual: PresentationVisual;
  speaker_notes: string;
  sources: string[];
};

export type PresentationStudioDeck = {
  type: "presentation_studio";
  title: string;
  audience: string;
  objective: string;
  tone: string;
  theme: string;
  durationMinutes: number;
  narrative: string;
  slides: PresentationStudioSlide[];
  review: {
    passed: boolean;
    notes: string[];
  };
};

export type PresentationRehearsalQuestion = {
  question: string;
  answer: string;
};

export type PresentationRehearsalSlide = {
  slideId: string;
  order: number;
  title: string;
  script30: string;
  script60: string;
  script120: string;
  keyPoints: string[];
  questions: PresentationRehearsalQuestion[];
};

export type PresentationRehearsal = {
  opening: string;
  closing: string;
  generalQuestions: PresentationRehearsalQuestion[];
  slides: PresentationRehearsalSlide[];
};

type UnknownRecord = Record<string, unknown>;

export function normalizePresentationPlan(raw: unknown): PresentationPlan {
  const record = asRecord(raw);
  const questions = asStringArray(record.clarificationQuestions, 3, 180);
  const rawSlides = Array.isArray(record.slides) ? record.slides : [];
  const slides = rawSlides.slice(0, 14).flatMap((item, index) => {
    const slide = asRecord(item);
    const title = asString(slide.title, 120);
    if (!title) return [];
    return [{
      id: `plan-${index + 1}`,
      order: index + 1,
      type: normalizeSlideType(slide.type, index === 0 ? "cover" : "text_image"),
      title,
      purpose: asString(slide.purpose, 280) || "Desenvolver este ponto da narrativa."
    }];
  });

  const ready = questions.length === 0 && slides.length >= 3;
  return {
    ready,
    title: asString(record.title, 160) || "Nova apresentação",
    audience: asString(record.audience, 160) || "Público geral",
    objective: asString(record.objective, 500) || "Explicar o tema com clareza.",
    tone: asString(record.tone, 80) || "didático",
    theme: normalizePresentationTheme(record.theme),
    durationMinutes: clampNumber(record.durationMinutes, 1, 180, 8),
    narrative: asString(record.narrative, 500) || "Contexto, desenvolvimento e conclusão.",
    clarificationQuestions: questions,
    slides: ready ? slides : []
  };
}

export function normalizePresentationDeck(raw: unknown, plan: PresentationPlan): PresentationStudioDeck {
  const record = asRecord(raw);
  const rawSlides = Array.isArray(record.slides) ? record.slides : [];
  const slides = plan.slides.map((plannedSlide, index) => {
    const source = asRecord(rawSlides[index]);
    const visual = asRecord(source.visual);
    return {
      id: `slide-${index + 1}`,
      order: index + 1,
      type: normalizeSlideType(source.type, plannedSlide.type),
      title: asString(source.title, 120) || plannedSlide.title,
      subtitle: asString(source.subtitle, 220),
      body: asStringArray(source.body, 5, 180),
      visual: {
        layout: asString(visual.layout, 180) || defaultLayout(plannedSlide.type),
        imageSuggestion: asString(visual.imageSuggestion, 240),
        emphasis: asString(visual.emphasis, 160)
      },
      speaker_notes: asString(source.speaker_notes, 2400),
      sources: asStringArray(source.sources, 5, 300)
    };
  });

  const reviewNotes = reviewDeck(slides);
  return {
    type: "presentation_studio",
    title: asString(record.title, 160) || plan.title,
    audience: asString(record.audience, 160) || plan.audience,
    objective: asString(record.objective, 500) || plan.objective,
    tone: asString(record.tone, 80) || plan.tone,
    theme: normalizePresentationTheme(record.theme || plan.theme),
    durationMinutes: clampNumber(record.durationMinutes, 1, 180, plan.durationMinutes),
    narrative: asString(record.narrative, 500) || plan.narrative,
    slides,
    review: {
      passed: reviewNotes.length === 0,
      notes: reviewNotes
    }
  };
}

export function applyVisualDirection(raw: unknown, deck: PresentationStudioDeck): PresentationStudioDeck {
  const record = asRecord(raw);
  const directions = Array.isArray(record.slides) ? record.slides : [];
  const slides = deck.slides.map((slide, index) => {
    const direction = asRecord(directions[index]);
    const visual = asRecord(direction.visual);
    return {
      ...slide,
      type: normalizeSlideType(direction.type, slide.type),
      visual: {
        layout: asString(visual.layout, 180) || slide.visual.layout,
        imageSuggestion: asString(visual.imageSuggestion, 240) || slide.visual.imageSuggestion,
        emphasis: asString(visual.emphasis, 160) || slide.visual.emphasis
      }
    };
  });
  const reviewNotes = reviewDeck(slides);
  return {
    ...deck,
    theme: normalizePresentationTheme(record.theme || deck.theme),
    slides,
    review: { passed: reviewNotes.length === 0, notes: reviewNotes }
  };
}

export function normalizeEditedSlide(raw: unknown, current: PresentationStudioSlide): PresentationStudioSlide {
  const record = asRecord(raw);
  const visual = asRecord(record.visual);
  return {
    ...current,
    type: normalizeSlideType(record.type, current.type),
    title: asString(record.title, 120) || current.title,
    subtitle: asString(record.subtitle, 220),
    body: asStringArray(record.body, 5, 180),
    visual: {
      layout: asString(visual.layout, 180) || current.visual.layout,
      imageSuggestion: asString(visual.imageSuggestion, 240) || current.visual.imageSuggestion,
      emphasis: asString(visual.emphasis, 160) || current.visual.emphasis
    },
    speaker_notes: asString(record.speaker_notes, 2400),
    sources: asStringArray(record.sources, 5, 300)
  };
}

export function normalizePresentationRehearsal(raw: unknown, deck: PresentationStudioDeck): PresentationRehearsal {
  const record = asRecord(raw);
  const rawSlides = Array.isArray(record.slides) ? record.slides : [];
  const slides = deck.slides.map((slide, index) => {
    const source = asRecord(rawSlides.find((item) => {
      const candidate = asRecord(item);
      return candidate.slideId === slide.id || Number(candidate.order) === slide.order;
    }) ?? rawSlides[index]);
    const questions = normalizeQuestions(source.questions, 3);
    const notes = slide.speaker_notes || [slide.subtitle, ...slide.body].filter(Boolean).join(" ");
    return {
      slideId: slide.id,
      order: slide.order,
      title: slide.title,
      script30: asString(source.script30, 900) || notes.slice(0, 900),
      script60: asString(source.script60, 1800) || notes.slice(0, 1800),
      script120: asString(source.script120, 3200) || notes.slice(0, 3200),
      keyPoints: asStringArray(source.keyPoints, 4, 180),
      questions
    };
  });
  return {
    opening: asString(record.opening, 1000),
    closing: asString(record.closing, 1000),
    generalQuestions: normalizeQuestions(record.generalQuestions, 5),
    slides
  };
}

function reviewDeck(slides: PresentationStudioSlide[]) {
  const notes: string[] = [];
  const normalizedTitles = slides.map((slide) => slide.title.trim().toLowerCase());
  if (new Set(normalizedTitles).size !== normalizedTitles.length) notes.push("Há títulos repetidos que merecem revisão.");
  if (slides.some((slide) => slide.body.length > 5)) notes.push("Alguns slides ainda têm conteúdo demais para leitura rápida.");
  if (slides.filter((slide) => slide.type === "text_image").length > Math.ceil(slides.length * 0.6)) {
    notes.push("A apresentação usa muitos layouts de texto e imagem; varie antes da exportação final.");
  }
  return notes;
}

function normalizeSlideType(value: unknown, fallback: SlideType): SlideType {
  return typeof value === "string" && slideTypes.includes(value as SlideType) ? value as SlideType : fallback;
}

function defaultLayout(type: SlideType) {
  const layouts: Record<SlideType, string> = {
    cover: "Título em destaque com um único elemento visual",
    section: "Título central e transição visual",
    text_image: "Texto conciso e imagem em composição assimétrica",
    comparison: "Duas colunas com contraste claro",
    timeline: "Linha temporal horizontal com marcos",
    process: "Etapas numeradas conectadas",
    data: "Número principal e contexto mínimo",
    chart: "Gráfico dominante com uma conclusão",
    quote: "Citação central com autoria",
    conclusion: "Síntese visual e três aprendizados",
    call_to_action: "Uma ação principal e fechamento"
  };
  return layouts[type];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function asString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function asStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function normalizeQuestions(value: unknown, maxItems: number): PresentationRehearsalQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).flatMap((item) => {
    const question = asRecord(item);
    const prompt = asString(question.question, 300);
    const answer = asString(question.answer, 900);
    return prompt && answer ? [{ question: prompt, answer }] : [];
  });
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
}
import { normalizePresentationTheme } from "@/lib/ai/presentations/themes";
