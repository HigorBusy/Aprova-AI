import { NextRequest, NextResponse } from "next/server";

import { callGroq, COMMANDER_SYSTEM_PROMPT } from "@/lib/ai/groq";
import { formatQuestionContext, formatRepertoryContext, formatStudentContext } from "@/lib/ai/student-context";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";
import { PRODUCT_CONFIG } from "@/lib/product-config";

export const runtime = "nodejs";

const CHAT_COST = PRODUCT_CONFIG.credits.tutorMessage;
const TOOL_COST = PRODUCT_CONFIG.credits.tutorTool;
const JSON_UTF8_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`ai-chat:${user.id}`, 12, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 64 * 1024);
  if (oversized) return oversized;

  let body: { message?: unknown; mode?: unknown; toolName?: unknown };
  try {
    body = (await request.json()) as { message?: unknown; mode?: unknown; toolName?: unknown };
  } catch {
    return jsonUtf8({ error: "Requisição inválida." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? sanitizeTextInput(body.message, 8_000) : "";
  const isTool = body.mode === "tool";
  const cost = isTool ? TOOL_COST : CHAT_COST;
  const toolName = typeof body.toolName === "string" ? sanitizeSingleLine(body.toolName, 80) : "Ferramenta IA";
  if (!message || message.length > 8_000) {
    return jsonUtf8(
      { error: "Envie uma mensagem entre 1 e 8.000 caracteres." },
      { status: 400 }
    );
  }

  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < cost) {
    return jsonUtf8({ error: "Você ficou sem créditos.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  const { data: recentMessages, error: historyError } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (historyError) return jsonUtf8({ error: "Não foi possível carregar o histórico." }, { status: 500 });

  const [{ data: repertorios }, { data: profile }, { data: essays }, { data: questionCatalog }] = await Promise.all([
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
      .limit(3),
    supabase.rpc("get_question_catalog")
  ]);

  const runtimeContext = [
    formatStudentContext(profile, essays),
    formatQuestionContext(questionCatalog),
    formatRepertoryContext(repertorios)
  ].join("\n\n");

  try {
    const reply = await callGroq(
      [
        { role: "system", content: COMMANDER_SYSTEM_PROMPT },
        { role: "system", content: runtimeContext },
        ...[...(recentMessages ?? [])]
          .reverse()
          .map((item) => ({ role: item.role as "user" | "assistant", content: item.content })),
        { role: "user", content: message }
      ],
      { temperature: 0.5, maxTokens: 1_100 }
    );

    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_ai_exchange",
      {
        p_user_content: message,
        p_assistant_content: reply,
        p_cost: cost,
        p_transaction_type: "ai_chat",
        p_description: isTool ? `Ferramenta IA: ${toolName}` : "Pergunta ao Comandante IA"
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      return jsonUtf8(
        { error: "Você ficou sem créditos.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return jsonUtf8({ reply, balance: result.balance });
  } catch (error) {
    console.error("Commander chat failed", {
      userId: user.id,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "O Comandante ainda não foi ativado no servidor." : "O Comandante não conseguiu responder agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}

function jsonUtf8(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", JSON_UTF8_HEADERS["Content-Type"]);

  return NextResponse.json(body, {
    ...init,
    headers
  });
}
