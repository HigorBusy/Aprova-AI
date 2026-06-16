import { NextRequest, NextResponse } from "next/server";

import { normalizeEssayReview, type RawEssayReview } from "@/lib/ai/essay-review";
import { callGroq, ESSAY_REVIEW_SYSTEM_PROMPT, parseJsonResponse } from "@/lib/ai/groq";
import { formatRepertoryContext, formatStudentContext } from "@/lib/ai/student-context";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ESSAY_COST = 5;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  let body: { essay?: unknown };
  try {
    body = (await request.json()) as { essay?: unknown };
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const essay = typeof body.essay === "string" ? body.essay.trim() : "";
  if (essay.length < 50 || essay.length > 30_000) {
    return NextResponse.json(
      { error: "Cole uma redacao entre 50 e 30.000 caracteres." },
      { status: 400 }
    );
  }

  const { supabase, user } = auth;
  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return NextResponse.json({ error: "Nao foi possivel verificar seus creditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < ESSAY_COST) {
    return NextResponse.json({ error: "Voce precisa de 5 creditos para corrigir uma redacao.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  try {
    const [{ data: repertorios }, { data: profile }, { data: essays }] = await Promise.all([
      supabase
        .from("repertorios")
        .select("autor,obra,tema,explicacao,categoria")
        .limit(12),
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

    const rawReview = await callGroq(
      [
        { role: "system", content: ESSAY_REVIEW_SYSTEM_PROMPT },
        { role: "system", content: runtimeContext },
        {
          role: "user",
          content: `Corrija esta redacao com rigor de banca ENEM. Se for curta, generica, sem repertorio ou sem proposta completa, penalize de verdade. Se for excelente, reconheca excelencia com base em evidencias objetivas e nao invente penalizacoes genericas.\n\n${essay}`
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
        p_description: "Correcao de redacao pelo Comandante IA",
        p_theme: inferEssayTheme(essay),
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
      return NextResponse.json(
        { error: "Voce precisa de 5 creditos para corrigir uma redacao.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return NextResponse.json({ review, balance: result.balance });
  } catch (error) {
    console.error("Essay review failed", error);
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return NextResponse.json(
      { error: missingKey ? "A correcao por IA ainda nao foi ativada no servidor." : "Nao foi possivel corrigir a redacao agora. Nenhum credito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}

function inferEssayTheme(essay: string) {
  const normalized = essay.replace(/\s+/g, " ").trim();
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
}
