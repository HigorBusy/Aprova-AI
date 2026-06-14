import { NextRequest, NextResponse } from "next/server";

import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import type { EssayReview } from "@/lib/ai/types";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ESSAY_COST = 5;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let body: { essay?: unknown };
  try {
    body = (await request.json()) as { essay?: unknown };
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const essay = typeof body.essay === "string" ? body.essay.trim() : "";
  if (essay.length < 50 || essay.length > 30_000) {
    return NextResponse.json(
      { error: "Cole uma redação entre 50 e 30.000 caracteres." },
      { status: 400 }
    );
  }

  const { supabase, user } = auth;
  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return NextResponse.json({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < ESSAY_COST) {
    return NextResponse.json({ error: "Você precisa de 5 créditos para corrigir uma redação.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  const systemPrompt = `Você é um corretor criterioso de redações do ENEM.
Analise apenas o texto fornecido. Não invente tema, repertório ou trechos ausentes.
Cada competência vale de 0 a 200 pontos e a nota total estimada vale de 0 a 1000.
Responda exclusivamente com JSON válido, sem markdown, neste formato:
{
  "type": "essay_review",
  "estimatedScore": 0,
  "competencies": {
    "c1": { "score": 0, "analysis": "" },
    "c2": { "score": 0, "analysis": "" },
    "c3": { "score": 0, "analysis": "" },
    "c4": { "score": 0, "analysis": "" },
    "c5": { "score": 0, "analysis": "" }
  },
  "strengths": [""],
  "weaknesses": [""],
  "improvements": [""],
  "summary": ""
}`;

  try {
    const rawReview = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: essay }
      ],
      { temperature: 0.2, maxTokens: 1_500, json: true }
    );
    const review = parseJsonResponse<EssayReview>(rawReview);

    if (review.type !== "essay_review" || typeof review.estimatedScore !== "number") {
      throw new Error("INVALID_ESSAY_REVIEW");
    }

    const storedUserContent = `[REDAÇÃO PARA CORREÇÃO]\n${essay}`;
    const storedAssistantContent = JSON.stringify(review);
    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_ai_exchange",
      {
        p_user_content: storedUserContent,
        p_assistant_content: storedAssistantContent,
        p_cost: ESSAY_COST,
        p_transaction_type: "essay_review",
        p_description: "Correção de redação pelo Comandante IA"
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      return NextResponse.json(
        { error: "Você precisa de 5 créditos para corrigir uma redação.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return NextResponse.json({ review, balance: result.balance });
  } catch (error) {
    console.error("Essay review failed", error);
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return NextResponse.json(
      { error: missingKey ? "A correção por IA ainda não foi ativada no servidor." : "Não foi possível corrigir a redação agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}
