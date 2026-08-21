import { NextRequest } from "next/server";

import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import { buildPresentationEditorPrompt, PRESENTATION_EDITOR_SYSTEM_PROMPT } from "@/lib/ai/presentations/prompts";
import { normalizeEditedSlide, type PresentationStudioSlide, type SlideType } from "@/lib/ai/presentations/schema";
import { presentationsDisabledResponse } from "@/lib/feature-access";
import { sanitizeSingleLine } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const EDIT_COST = 1;

type PresentationRow = {
  id: string;
  title: string;
  audience: string;
  objective: string;
  tone: string;
  theme: string;
  status: string;
};

type SlideRow = {
  id: string;
  order_index: number;
  slide_type: SlideType;
  title: string;
  subtitle: string;
  body: string[];
  visual: PresentationStudioSlide["visual"];
  speaker_notes: string;
  sources: string[];
};

export async function POST(
  request: NextRequest,
  context: { params: { id: string; slideId: string } }
) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`presentation-edit:${user.id}`, 8, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 24 * 1024);
  if (oversized) return oversized;
  const body = await request.json().catch(() => null) as { instruction?: unknown } | null;
  const instruction = sanitizeSingleLine(typeof body?.instruction === "string" ? body.instruction : "", 500);
  if (instruction.length < 3) return jsonUtf8({ error: "Descreva a mudança que deseja neste slide." }, { status: 400 });

  const [presentationResult, slideResult, titlesResult, creditResult] = await Promise.all([
    supabase
      .from("presentations")
      .select("id,title,audience,objective,tone,theme,status")
      .eq("id", context.params.id)
      .eq("user_id", user.id)
      .maybeSingle<PresentationRow>(),
    supabase
      .from("presentation_slides")
      .select("id,order_index,slide_type,title,subtitle,body,visual,speaker_notes,sources")
      .eq("id", context.params.slideId)
      .eq("presentation_id", context.params.id)
      .eq("user_id", user.id)
      .maybeSingle<SlideRow>(),
    supabase
      .from("presentation_slides")
      .select("order_index,title")
      .eq("presentation_id", context.params.id)
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle<{ balance: number }>()
  ]);

  const presentation = presentationResult.data;
  const slide = slideResult.data;
  if (!presentation || presentation.status !== "generated" || !slide) {
    return jsonUtf8({ error: "Slide não encontrado." }, { status: 404 });
  }
  if (presentationResult.error || slideResult.error || titlesResult.error || creditResult.error) {
    return jsonUtf8({ error: "Não foi possível carregar o contexto do slide." }, { status: 500 });
  }
  if (!creditResult.data || creditResult.data.balance < EDIT_COST) {
    return jsonUtf8({ error: "Você precisa de 1 crédito para editar este slide com IA.", balance: creditResult.data?.balance ?? 0 }, { status: 402 });
  }

  const currentSlide: PresentationStudioSlide = {
    id: slide.id,
    order: slide.order_index + 1,
    type: slide.slide_type,
    title: slide.title,
    subtitle: slide.subtitle,
    body: Array.isArray(slide.body) ? slide.body : [],
    visual: slide.visual,
    speaker_notes: slide.speaker_notes,
    sources: Array.isArray(slide.sources) ? slide.sources : []
  };

  try {
    const raw = await callGroq(
      [
        { role: "system", content: PRESENTATION_EDITOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildPresentationEditorPrompt({
            instruction,
            presentation: {
              title: presentation.title,
              audience: presentation.audience,
              objective: presentation.objective,
              tone: presentation.tone,
              theme: presentation.theme
            },
            currentSlide,
            neighboringSlides: (titlesResult.data ?? []).map((item) => ({
              order: item.order_index + 1,
              title: item.title
            }))
          })
        }
      ],
      { temperature: 0.3, maxTokens: 2_400, json: true }
    );
    const editedSlide = normalizeEditedSlide(parseJsonResponse<unknown>(raw), currentSlide);
    const { data: completion, error: completionError } = await supabase.rpc("complete_presentation_slide_edit", {
      p_presentation_id: presentation.id,
      p_slide_id: slide.id,
      p_slide: editedSlide,
      p_cost: EDIT_COST
    });
    const result = Array.isArray(completion) ? completion[0] : completion;
    if (completionError) throw completionError;
    if (!result?.success) {
      return jsonUtf8({ error: "Você precisa de 1 crédito para editar este slide com IA.", balance: result?.balance ?? 0 }, { status: 402 });
    }
    return jsonUtf8({ slide: editedSlide, balance: result.balance });
  } catch (error) {
    console.error("Presentation slide edit failed", {
      userId: user.id,
      presentationId: presentation.id,
      slideId: slide.id,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "A edição por IA ainda não foi ativada no servidor." : "Não foi possível editar o slide agora." },
      { status: missingKey ? 503 : 502 }
    );
  }
}
