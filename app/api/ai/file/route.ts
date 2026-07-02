import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { callGroq, COMMANDER_SYSTEM_PROMPT } from "@/lib/ai/groq";
import { formatRepertoryContext, formatStudentContext } from "@/lib/ai/student-context";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const FILE_COST = 3;
const PDF_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const TEXT_LIMIT = 12_000;

const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { supabase, user } = auth;

  const rateLimit = checkRateLimit(`ai-file:${user.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return jsonUtf8(response.body, response.init);
  }

  const oversized = rejectLargeRequest(request, 11 * 1024 * 1024);
  if (oversized) return oversized;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonUtf8({ error: "Envie um arquivo válido." }, { status: 400 });
  }

  const file = formData.get("file");
  const toolName = sanitizeSingleLine(String(formData.get("toolName") || "Explicar arquivo"), 80);
  const prompt = sanitizeTextInput(String(formData.get("prompt") || ""), 1_500);

  if (!(file instanceof File)) {
    return jsonUtf8({ error: "Arquivo não encontrado." }, { status: 400 });
  }

  const validation = validateFile(file);
  if (!validation.ok) {
    return jsonUtf8({ error: validation.error }, { status: 400 });
  }

  const { data: creditRow, error: creditError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creditError) return jsonUtf8({ error: "Não foi possível verificar seus créditos." }, { status: 500 });
  if (!creditRow || creditRow.balance < FILE_COST) {
    return jsonUtf8({ error: "Você precisa de 3 créditos para analisar arquivo.", balance: creditRow?.balance ?? 0 }, { status: 402 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let extractedText = "";
  try {
    extractedText = file.type === "application/pdf"
      ? await extractPdfText(bytes)
      : await extractImageText(bytes);
  } catch (error) {
    console.error("File extraction failed", {
      userId: user.id,
      fileType: file.type,
      fileSize: file.size,
      reason: error instanceof Error ? error.message : "unknown"
    });
    return jsonUtf8({ error: "Não foi possível extrair texto utilizável do arquivo. Nenhum crédito foi consumido." }, { status: 422 });
  }

  const cleanText = extractedText.replace(/\s+/g, " ").trim().slice(0, TEXT_LIMIT);
  if (cleanText.length < 12) {
    return jsonUtf8({ error: "O arquivo não gerou texto suficiente para análise. Nenhum crédito foi consumido." }, { status: 422 });
  }

  const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    console.error("Upload failed", { userId: user.id, fileType: file.type, fileSize: file.size });
    return jsonUtf8({ error: "Não foi possível salvar o arquivo." }, { status: 500 });
  }

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

  const userContent = [
    `[ARQUIVO: ${file.name}]`,
    `Tipo: ${file.type}. Ferramenta: ${toolName}.`,
    prompt ? `Pedido do aluno: ${prompt}` : "Pedido do aluno: explique o arquivo e transforme em ação de estudo.",
    "",
    "Texto extraído:",
    cleanText
  ].join("\n");

  try {
    const reply = await callGroq(
      [
        { role: "system", content: COMMANDER_SYSTEM_PROMPT },
        { role: "system", content: runtimeContext },
        {
          role: "user",
          content: `${userContent}\n\nResponda como Comandante IA. Seja prático: resumo, explicação, pontos importantes e próxima tarefa.`
        }
      ],
      { temperature: 0.45, maxTokens: 1_300 }
    );

    const { data: completion, error: completionError } = await supabase.rpc(
      "complete_ai_exchange",
      {
        p_user_content: userContent,
        p_assistant_content: reply,
        p_cost: FILE_COST,
        p_transaction_type: "ai_chat",
        p_description: `${toolName}: ${file.name}`
      }
    );
    const result = Array.isArray(completion) ? completion[0] : completion;

    if (completionError) throw completionError;
    if (!result?.success) {
      await deleteUploadedFile(supabase, storagePath);
      return jsonUtf8(
        { error: "Você precisa de 3 créditos para analisar arquivo.", balance: result?.balance ?? 0 },
        { status: 402 }
      );
    }

    return jsonUtf8({
      reply,
      balance: result.balance
    });
  } catch (error) {
    await deleteUploadedFile(supabase, storagePath);
    console.error("Commander file analysis failed", {
      userId: user.id,
      fileType: file.type,
      fileSize: file.size,
      reason: error instanceof Error ? error.message : "unknown"
    });
    const missingKey = error instanceof Error && error.message === "GROQ_API_KEY_NOT_CONFIGURED";
    return jsonUtf8(
      { error: missingKey ? "O Comandante ainda não foi ativado no servidor." : "Não foi possível analisar o arquivo agora. Nenhum crédito foi consumido." },
      { status: missingKey ? 503 : 502 }
    );
  }
}

async function deleteUploadedFile(supabase: SupabaseClient, storagePath: string) {
  try {
    await supabase.storage.from("uploads").remove([storagePath]);
  } catch {
    // Best-effort cleanup only. The user-facing operation already failed.
  }
}

function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.type === "application/pdf") {
    if (file.size > PDF_MAX_BYTES) return { ok: false, error: "PDF deve ter no máximo 10MB." };
    return { ok: true };
  }

  if (imageTypes.has(file.type)) {
    if (file.size > IMAGE_MAX_BYTES) return { ok: false, error: "Imagem deve ter no máximo 5MB." };
    return { ok: true };
  }

  return { ok: false, error: "Formato não aceito. Envie PDF, PNG, JPG, JPEG ou WEBP." };
}

async function extractPdfText(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text || "";
}

async function extractImageText(buffer: Buffer) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  try {
    const result = await worker.recognize(buffer);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120) || "arquivo";
}
