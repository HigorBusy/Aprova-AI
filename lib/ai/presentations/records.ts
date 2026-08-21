import {
  normalizeEditedSlide,
  normalizePresentationPlan,
  type PresentationPlan,
  type PresentationStudioDeck,
  type PresentationStudioSlide
} from "@/lib/ai/presentations/schema";
import { normalizePresentationTheme } from "@/lib/ai/presentations/themes";

export type PresentationRecord = {
  id: string;
  title: string;
  source_prompt: string;
  audience: string;
  objective: string;
  tone: string;
  theme: string;
  duration_minutes: number;
  status: "planned" | "generated" | "archived";
  plan: unknown;
  slide_count: number;
  share_token?: string | null;
  is_public?: boolean;
  shared_at?: string | null;
  rehearsal?: unknown;
  rehearsal_updated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PresentationSlideRecord = {
  id: string;
  order_index: number;
  slide_type: string;
  title: string;
  subtitle: string;
  body: unknown;
  visual: unknown;
  speaker_notes: string;
  sources: unknown;
  updated_at?: string;
};

export function planFromRecord(record: PresentationRecord): PresentationPlan {
  return normalizePresentationPlan(record.plan);
}

export function deckFromRecords(
  presentation: PresentationRecord,
  slideRows: PresentationSlideRecord[]
): PresentationStudioDeck {
  const storedPlan = normalizePresentationPlan(presentation.plan);
  const slides = slideRows
    .sort((a, b) => a.order_index - b.order_index)
    .map((row, index): PresentationStudioSlide => normalizeEditedSlide({
      id: row.id,
      order: index + 1,
      type: row.slide_type,
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
      visual: row.visual,
      speaker_notes: row.speaker_notes,
      sources: row.sources
    }, {
      id: row.id,
      order: index + 1,
      type: "text_image",
      title: row.title || "Slide sem título",
      subtitle: "",
      body: [],
      visual: { layout: "Título e conteúdo", imageSuggestion: "", emphasis: "" },
      speaker_notes: "",
      sources: []
    }));

  return {
    type: "presentation_studio",
    title: presentation.title,
    audience: presentation.audience,
    objective: presentation.objective,
    tone: presentation.tone,
    theme: normalizePresentationTheme(presentation.theme),
    durationMinutes: presentation.duration_minutes,
    narrative: storedPlan.narrative,
    slides,
    review: { passed: true, notes: [] }
  };
}
