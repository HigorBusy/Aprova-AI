import type { NextRequest } from "next/server";

import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import { buildPresentationCoachPrompt, PRESENTATION_COACH_SYSTEM_PROMPT } from "@/lib/ai/presentations/prompts";
import { deckFromRecords, type PresentationRecord, type PresentationSlideRecord } from "@/lib/ai/presentations/records";
import { normalizePresentationRehearsal } from "@/lib/ai/presentations/schema";
import { presentationsDisabledResponse } from "@/lib/feature-access";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8 } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const rateLimit = checkRateLimit(`presentation-rehearsal:${auth.user.id}`, 3, 5 * 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const [presentationResult, slidesResult] = await Promise.all([
    auth.supabase.from("presentations").select("*").eq("id", context.params.id).eq("user_id", auth.user.id).eq("status", "generated").maybeSingle<PresentationRecord>(),
    auth.supabase.from("presentation_slides").select("id, order_index, slide_type, title, subtitle, body, visual, speaker_notes, sources, updated_at").eq("presentation_id", context.params.id).eq("user_id", auth.user.id).order("order_index", { ascending: true }).returns<PresentationSlideRecord[]>()
  ]);
  const presentation = presentationResult.data;
  const slides = slidesResult.data;
  if (presentationResult.error || !presentation || slidesResult.error || !slides?.length) {
    return jsonUtf8({ error: "Apresentação não encontrada ou ainda não gerada." }, { status: 404 });
  }

  const deck = deckFromRecords(presentation, slides);
  const cachedAt = presentation.rehearsal_updated_at ? Date.parse(presentation.rehearsal_updated_at) : 0;
  const cacheIsFresh = cachedAt > 0 && slides.every((slide) => !slide.updated_at || Date.parse(slide.updated_at) <= cachedAt);
  const cached = presentation.rehearsal && typeof presentation.rehearsal === "object" && Object.keys(presentation.rehearsal as object).length > 0;
  if (cached && cacheIsFresh) {
    return jsonUtf8({ rehearsal: normalizePresentationRehearsal(presentation.rehearsal, deck), source: "cache" });
  }

  try {
    const coachContext = {
      title: deck.title,
      audience: deck.audience,
      objective: deck.objective,
      tone: deck.tone,
      durationMinutes: deck.durationMinutes,
      narrative: deck.narrative,
      slides: deck.slides.map((slide) => ({ id: slide.id, order: slide.order, title: slide.title, subtitle: slide.subtitle, body: slide.body, speaker_notes: slide.speaker_notes }))
    };
    const raw = await callGroq([
      { role: "system", content: PRESENTATION_COACH_SYSTEM_PROMPT },
      { role: "user", content: buildPresentationCoachPrompt(coachContext) }
    ], { temperature: 0.35, maxTokens: 8_000, json: true, timeoutMs: 45_000 });
    const rehearsal = normalizePresentationRehearsal(parseJsonResponse<unknown>(raw), deck);
    if (!rehearsal.slides.some((slide) => slide.script30 || slide.script60 || slide.script120)) throw new Error("EMPTY_REHEARSAL");
    const { error: saveError } = await auth.supabase.from("presentations").update({ rehearsal, rehearsal_updated_at: new Date().toISOString() }).eq("id", presentation.id).eq("user_id", auth.user.id);
    if (saveError) throw saveError;
    return jsonUtf8({ rehearsal, source: "generated" });
  } catch (error) {
    console.error("[presentation-rehearsal]", { userId: auth.user.id, presentationId: presentation.id, reason: error instanceof Error ? error.message : "unknown" });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8({ error: missingKey ? "O treinador ainda não foi ativado no servidor." : "Não foi possível preparar o treino agora." }, { status: missingKey ? 503 : 502 });
  }
}
