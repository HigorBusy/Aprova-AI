import { NextRequest } from "next/server";

import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import {
  buildSlideWriterPrompt,
  buildVisualDirectorPrompt,
  SLIDE_WRITER_SYSTEM_PROMPT,
  VISUAL_DIRECTOR_SYSTEM_PROMPT
} from "@/lib/ai/presentations/prompts";
import { applyVisualDirection, normalizePresentationDeck, normalizePresentationPlan } from "@/lib/ai/presentations/schema";
import { presentationsDisabledResponse } from "@/lib/feature-access";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PRESENTATION_COST = 10;

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`presentation-generate:${user.id}`, 3, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 96 * 1024);
  if (oversized) return oversized;

  const body = await request.json().catch(() => null) as { plan?: unknown } | null;
  const plan = normalizePresentationPlan(body?.plan);
  if (!plan.ready || plan.slides.length < 3) {
    return jsonUtf8({ error: "A estrutura precisa ter pelo menos 3 slides antes da geração." }, { status: 400 });
  }

  const [{ data: presentation, error: presentationError }, { data: creditRow, error: creditError }] = await Promise.all([
    supabase
      .from("presentations")
      .select("id,source_prompt,status")
      .eq("id", context.params.id)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string; source_prompt: string; status: string }>(),
    supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle<{ balance: number }>()
  ]);

  if (presentationError || !presentation) return jsonUtf8({ error: "Apresentação não encontrada." }, { status: 404 });
  if (presentation.status !== "planned") return jsonUtf8({ error: "Esta apresentação já foi gerada." }, { status: 409 });
  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < PRESENTATION_COST) {
    return jsonUtf8({ error: "Você precisa de 10 créditos para gerar os slides.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  try {
    const { error: planUpdateError } = await supabase
      .from("presentations")
      .update({
        title: plan.title,
        audience: plan.audience,
        objective: plan.objective,
        tone: plan.tone,
        theme: plan.theme,
        duration_minutes: plan.durationMinutes,
        plan,
        updated_at: new Date().toISOString()
      })
      .eq("id", presentation.id)
      .eq("user_id", user.id);
    if (planUpdateError) throw new Error("PRESENTATION_PLAN_UPDATE_FAILED");

    const raw = await callGroq(
      [
        { role: "system", content: SLIDE_WRITER_SYSTEM_PROMPT },
        { role: "user", content: buildSlideWriterPrompt(plan, presentation.source_prompt) }
      ],
      { temperature: 0.34, maxTokens: 6_000, json: true, timeoutMs: 24_000 }
    );
    const writtenDeck = normalizePresentationDeck(parseJsonResponse<unknown>(raw), plan);
    const visualRaw = await callGroq(
      [
        { role: "system", content: VISUAL_DIRECTOR_SYSTEM_PROMPT },
        { role: "user", content: buildVisualDirectorPrompt(plan, writtenDeck) }
      ],
      { temperature: 0.24, maxTokens: 4_200, json: true, timeoutMs: 24_000 }
    );
    const deck = applyVisualDirection(parseJsonResponse<unknown>(visualRaw), writtenDeck);

    const { data: completion, error: completionError } = await supabase.rpc("complete_presentation_generation", {
      p_presentation_id: presentation.id,
      p_deck: deck,
      p_cost: PRESENTATION_COST
    });
    const result = Array.isArray(completion) ? completion[0] : completion;
    if (completionError) throw completionError;
    if (!result?.success) {
      return jsonUtf8({ error: "Você precisa de 10 créditos para gerar os slides.", balance: result?.balance ?? 0 }, { status: 402 });
    }

    const { data: storedSlides, error: slidesError } = await supabase
      .from("presentation_slides")
      .select("id,order_index,slide_type,title,subtitle,body,visual,speaker_notes,sources,updated_at")
      .eq("presentation_id", presentation.id)
      .order("order_index", { ascending: true });
    if (slidesError) throw new Error("PRESENTATION_SLIDES_NOT_LOADED");

    return jsonUtf8({
      presentationId: presentation.id,
      deck: {
        ...deck,
        slides: (storedSlides ?? []).map((slide) => ({
          id: slide.id,
          order: slide.order_index + 1,
          type: slide.slide_type,
          title: slide.title,
          subtitle: slide.subtitle ?? "",
          body: Array.isArray(slide.body) ? slide.body : [],
          visual: slide.visual,
          speaker_notes: slide.speaker_notes ?? "",
          sources: Array.isArray(slide.sources) ? slide.sources : []
        }))
      },
      balance: result.balance
    });
  } catch (error) {
    console.error("Presentation generation failed", {
      userId: user.id,
      presentationId: presentation.id,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "A criação por IA ainda não foi ativada no servidor." : "Não foi possível concluir a geração dos slides agora." },
      { status: missingKey ? 503 : 502 }
    );
  }
}
