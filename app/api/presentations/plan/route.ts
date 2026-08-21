import { NextRequest } from "next/server";

import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import { buildPlannerPrompt, PRESENTATION_PLANNER_SYSTEM_PROMPT } from "@/lib/ai/presentations/prompts";
import { normalizePresentationPlan } from "@/lib/ai/presentations/schema";
import { presentationsDisabledResponse } from "@/lib/feature-access";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PRESENTATION_COST = 10;

export async function POST(request: NextRequest) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`presentation-plan:${user.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 48 * 1024);
  if (oversized) return oversized;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const sourceRequest = sanitizeTextInput(typeof body?.request === "string" ? body.request : "", 4_000);
  const audience = sanitizeSingleLine(typeof body?.audience === "string" ? body.audience : "", 160);
  const tone = sanitizeSingleLine(typeof body?.tone === "string" ? body.tone : "", 80);
  const durationMinutes = clampDuration(body?.durationMinutes);
  const answers = Array.isArray(body?.answers)
    ? body.answers.map((item) => sanitizeSingleLine(String(item), 240)).filter(Boolean).slice(0, 3)
    : [];
  const presentationId = typeof body?.presentationId === "string" && /^[0-9a-f-]{36}$/i.test(body.presentationId)
    ? body.presentationId
    : null;

  if (sourceRequest.length < 12) {
    return jsonUtf8({ error: "Descreva a apresentação com pelo menos 12 caracteres." }, { status: 400 });
  }

  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle<{ balance: number }>();

  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < PRESENTATION_COST) {
    return jsonUtf8({ error: "Você precisa de 10 créditos para criar a apresentação.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  try {
    const raw = await callGroq(
      [
        { role: "system", content: PRESENTATION_PLANNER_SYSTEM_PROMPT },
        { role: "user", content: buildPlannerPrompt({ request: sourceRequest, audience, tone, durationMinutes, answers }) }
      ],
      { temperature: 0.25, maxTokens: 2_600, json: true }
    );
    const plan = normalizePresentationPlan(parseJsonResponse<unknown>(raw));

    if (!plan.ready) {
      return jsonUtf8({ plan, balance: creditRow.balance });
    }

    const presentationPayload = {
        user_id: user.id,
        title: plan.title,
        source_prompt: sourceRequest,
        audience: plan.audience,
        objective: plan.objective,
        tone: plan.tone,
        theme: plan.theme,
        duration_minutes: plan.durationMinutes,
        status: "planned",
        plan,
        slide_count: 0,
        updated_at: new Date().toISOString()
      };

    const query = presentationId
      ? supabase
          .from("presentations")
          .update(presentationPayload)
          .eq("id", presentationId)
          .eq("user_id", user.id)
          .eq("status", "planned")
      : supabase.from("presentations").insert(presentationPayload);

    const { data: presentation, error: insertError } = await query
      .select("id")
      .single<{ id: string }>();

    if (insertError || !presentation) throw new Error("PRESENTATION_PLAN_NOT_SAVED");
    return jsonUtf8({ presentationId: presentation.id, plan, balance: creditRow.balance });
  } catch (error) {
    console.error("Presentation planning failed", {
      userId: user.id,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "A criação por IA ainda não foi ativada no servidor." : "Não foi possível planejar a apresentação agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}

function clampDuration(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.round(parsed))) : undefined;
}
