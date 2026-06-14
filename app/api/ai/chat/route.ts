import { NextRequest, NextResponse } from "next/server";

import { callGroq, COMMANDER_SYSTEM_PROMPT } from "@/lib/ai/groq";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CHAT_COST = 1;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let body: { message?: unknown };
  try {
    body = (await request.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 8_000) {
    return NextResponse.json(
      { error: "Envie uma mensagem entre 1 e 8.000 caracteres." },
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
  if (!creditRow || creditRow.balance < CHAT_COST) {
    return NextResponse.json({ error: "Você ficou sem créditos.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  const { data: recentMessages, error: historyError } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (historyError) return NextResponse.json({ error: "Não foi possível carregar o histórico." }, { status: 500 });

  try {
    const reply = await callGroq([
      { role: "system", content: COMMANDER_SYSTEM_PROMPT },
      ...[...(recentMessages ?? [])]
        .reverse()
        .map((item) => ({ role: item.role as "user" | "assistant", content: item.content })),
      { role: "user", content: message }
    ]);

    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_ai_exchange",
      {
        p_user_content: message,
        p_assistant_content: reply,
        p_cost: CHAT_COST,
        p_transaction_type: "ai_chat",
        p_description: "Pergunta ao Comandante IA"
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      return NextResponse.json(
        { error: "Você ficou sem créditos.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return NextResponse.json({ reply, balance: result.balance });
  } catch (error) {
    console.error("Commander chat failed", error);
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return NextResponse.json(
      { error: missingKey ? "O Comandante ainda não foi ativado no servidor." : "O Comandante não conseguiu responder agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}
