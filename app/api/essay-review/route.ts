import { NextRequest } from "next/server";

import { normalizeEssayReview, type RawEssayReview } from "@/lib/ai/essay-review";
import { callGroq, ESSAY_REVIEW_SYSTEM_PROMPT, parseJsonResponse } from "@/lib/ai/groq";
import { formatRepertoryContext, formatStudentContext } from "@/lib/ai/student-context";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";
import { PRODUCT_CONFIG } from "@/lib/product-config";

export const runtime = "nodejs";

const ESSAY_COST = PRODUCT_CONFIG.credits.essayReview;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`essay-review:${user.id}`, 4, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 160 * 1024);
  if (oversized) return oversized;

  let body: { essay?: unknown; theme?: unknown };
  try {
    body = (await request.json()) as { essay?: unknown; theme?: unknown };
  } catch {
    return jsonUtf8({ error: "Requisição inválida." }, { status: 400 });
  }

  const essay = typeof body.essay === "string" ? sanitizeTextInput(body.essay, 30_000) : "";
  const theme = typeof body.theme === "string" ? sanitizeSingleLine(body.theme, 300) : "";
  if (essay.length < 50 || essay.length > 30_000) {
    return jsonUtf8(
      { error: "Cole uma redação entre 50 e 30.000 caracteres." },
      { status: 400 }
    );
  }
  if (theme.length < 8) {
    return jsonUtf8(
      { error: "Informe o tema proposto para avaliar a Competência 2." },
      { status: 400 }
    );
  }

  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < ESSAY_COST) {
    return jsonUtf8({ error: `Você precisa de ${ESSAY_COST} crédito para corrigir uma redação.`, balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  try {
    const [{ data: repertorios }, { data: profile }, { data: essays }] = await Promise.all([
      supabase
        .from("repertorios")
        .select("autor,obra,tema,explicacao,categoria")
        .limit(12),
      supabase
        .from("student_profile")
        .select("average_score,best_score,worst_competency,best_competency,total_essays,last_essay_date,target_exam_year,main_difficulty,priority_area,essay_level,study_frequency")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("essay_reviews")
        .select("score,c1,c2,c3,c4,c5,theme,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ]);
    const runtimeContext = [
      formatStudentContext(profile, essays),
      formatRepertoryContext(repertorios)
    ].join("\n\n");

    const rawReview = await callGroq(
      [
        { role: "system", content: ESSAY_REVIEW_SYSTEM_PROMPT },
        { role: "system", content: runtimeContext },
        {
          role: "user",
          content: `Corrija esta redação com rigor de banca ENEM. Compare o texto ao tema proposto para avaliar abordagem completa, tangenciamento ou fuga. Se for curta, genérica, sem repertório ou sem proposta completa, penalize de verdade. Se for excelente, reconheça excelência com base em evidências objetivas e não invente penalizações genéricas.\n\nTEMA PROPOSTO:\n${theme}\n\nREDAÇÃO DO ALUNO:\n${essay}`
        }
      ],
      { temperature: 0.2, maxTokens: 2_400, json: true }
    );
    const review = normalizeEssayReview(parseJsonResponse<RawEssayReview>(rawReview), essay);

    const storedUserContent = `[REDACAO PARA CORRECAO]\n${essay}`;
    const storedAssistantContent = JSON.stringify(review);
    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_essay_review",
      {
        p_user_content: storedUserContent,
        p_assistant_content: storedAssistantContent,
        p_cost: ESSAY_COST,
        p_description: "Correção de redação pelo Comandante IA",
        p_theme: theme,
        p_score: review.estimatedScore,
        p_c1: review.competencies.c1.score,
        p_c2: review.competencies.c2.score,
        p_c3: review.competencies.c3.score,
        p_c4: review.competencies.c4.score,
        p_c5: review.competencies.c5.score
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      return jsonUtf8(
        { error: `Você precisa de ${ESSAY_COST} crédito para corrigir uma redação.`, balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return jsonUtf8({ review, balance: result.balance });
  } catch (error) {
    const structuredError = error && typeof error === "object"
      ? error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
      : null;
    console.error("Essay review failed", {
      userId: user.id,
      reason: error instanceof Error
        ? error.message
        : typeof structuredError?.message === "string"
          ? structuredError.message
          : "unknown",
      code: typeof structuredError?.code === "string" ? structuredError.code : undefined,
      details: typeof structuredError?.details === "string" ? structuredError.details.slice(0, 240) : undefined,
      hint: typeof structuredError?.hint === "string" ? structuredError.hint.slice(0, 240) : undefined
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "A correção por IA ainda não foi ativada no servidor." : "Não foi possível corrigir a redação agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}
