import { NextRequest } from "next/server";

import { COMMANDER_SYSTEM_PROMPT, callGroq, parseJsonResponse } from "@/lib/ai/groq";
import {
  PRESENTATION_COST,
  buildPresentationPrompt,
  normalizePresentationDeck,
  presentationTemplates,
  type PresentationDeck,
  type PresentationTemplate
} from "@/lib/ai/presentation";
import { formatRepertoryContext, formatStudentContext } from "@/lib/ai/student-context";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`ai-presentation:${user.id}`, 3, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 96 * 1024);
  if (oversized) return oversized;

  let body: {
    request?: unknown;
    template?: unknown;
    course?: unknown;
    examDate?: unknown;
    hoursPerDay?: unknown;
    difficultSubjects?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonUtf8({ error: "Requisição inválida." }, { status: 400 });
  }

  const userRequest = typeof body.request === "string" ? sanitizeTextInput(body.request, 4_000) : "";
  const template = resolveTemplate(body.template);
  const course = typeof body.course === "string" ? sanitizeSingleLine(body.course, 120) : "";
  const examDate = typeof body.examDate === "string" ? sanitizeSingleLine(body.examDate, 80) : "";
  const hoursPerDay = typeof body.hoursPerDay === "string" ? sanitizeSingleLine(body.hoursPerDay, 80) : "";
  const difficultSubjects = typeof body.difficultSubjects === "string"
    ? sanitizeSingleLine(body.difficultSubjects, 180)
    : "";

  if (userRequest.length < 12) {
    return jsonUtf8(
      { error: "Descreva o que você quer transformar em apresentação." },
      { status: 400 }
    );
  }

  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < PRESENTATION_COST) {
    return jsonUtf8(
      { error: "Você precisa de 10 créditos para gerar uma apresentação.", balance: creditRow?.balance ?? 0 },
      { status: 402 }
    );
  }

  const [{ data: repertorios }, { data: profile }, { data: essays }] = await Promise.all([
    supabase.from("repertorios").select("autor,obra,tema,explicacao,categoria").limit(12),
    supabase
      .from("student_profile")
      .select("average_score,best_score,worst_competency,best_competency,total_essays,last_essay_date")
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

  try {
    const prompt = buildPresentationPrompt({
      request: userRequest,
      template,
      course,
      examDate,
      hoursPerDay,
      difficultSubjects
    });

    const raw = await callGroq(
      [
        { role: "system", content: COMMANDER_SYSTEM_PROMPT },
        { role: "system", content: runtimeContext },
        { role: "user", content: prompt }
      ],
      { temperature: 0.35, maxTokens: 2_800, json: true }
    );

    const presentation = normalizePresentationDeck(
      parseJsonResponse<Partial<PresentationDeck>>(raw),
      template
    );
    const storedUserContent = `[APRESENTACAO SOLICITADA]\nTemplate: ${template}\n${userRequest}`;
    const storedAssistantContent = JSON.stringify(presentation);

    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_ai_exchange",
      {
        p_user_content: storedUserContent,
        p_assistant_content: storedAssistantContent,
        p_cost: PRESENTATION_COST,
        p_transaction_type: "ai_chat",
        p_description: `Apresentação IA: ${template}`
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      return jsonUtf8(
        { error: "Você precisa de 10 créditos para gerar uma apresentação.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return jsonUtf8({ presentation, balance: result.balance });
  } catch (error) {
    console.error("Presentation generation failed", {
      userId: user.id,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      {
        error: missingKey
          ? "O Comandante ainda não foi ativado no servidor."
          : "Não foi possível gerar a apresentação agora. Nenhum crédito foi consumido."
      },
      { status: missingKey ? 503 : 502 }
    );
  }
}

function resolveTemplate(value: unknown): PresentationTemplate {
  const candidate = typeof value === "string" ? value : "";
  return presentationTemplates.includes(candidate as PresentationTemplate)
    ? candidate as PresentationTemplate
    : "Plano de Estudos";
}
