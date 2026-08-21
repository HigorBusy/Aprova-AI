import type { NextRequest } from "next/server";

import { createPresentationPdf, createPresentationPptx, safePresentationFilename } from "@/lib/ai/presentations/export";
import { deckFromRecords, type PresentationRecord, type PresentationSlideRecord } from "@/lib/ai/presentations/records";
import { presentationsDisabledResponse } from "@/lib/feature-access";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { jsonUtf8 } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const rateLimit = checkRateLimit(`presentation-export:${auth.user.id}`, 8, 60_000);
  if (!rateLimit.allowed) return jsonUtf8({ error: "Aguarde um momento antes de exportar novamente." }, { status: 429 });

  const format = request.nextUrl.searchParams.get("format");
  if (format !== "pdf" && format !== "pptx") return jsonUtf8({ error: "Formato de exportação inválido." }, { status: 400 });

  const [presentationResult, slidesResult] = await Promise.all([
    auth.supabase.from("presentations").select("*").eq("id", context.params.id).eq("user_id", auth.user.id).eq("status", "generated").maybeSingle<PresentationRecord>(),
    auth.supabase.from("presentation_slides").select("id, order_index, slide_type, title, subtitle, body, visual, speaker_notes, sources").eq("presentation_id", context.params.id).eq("user_id", auth.user.id).order("order_index", { ascending: true }).returns<PresentationSlideRecord[]>()
  ]);

  if (presentationResult.error || !presentationResult.data || slidesResult.error || !slidesResult.data?.length) {
    return jsonUtf8({ error: "Apresentação não encontrada ou ainda não gerada." }, { status: 404 });
  }

  try {
    const deck = deckFromRecords(presentationResult.data, slidesResult.data);
    const filename = `${safePresentationFilename(deck.title)}.${format}`;
    const bytes = format === "pdf" ? await createPresentationPdf(deck) : await createPresentationPptx(deck);
    const responseBody = Uint8Array.from(bytes).buffer;
    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("[presentation-export]", error instanceof Error ? error.message : "unknown_error");
    return jsonUtf8({ error: "Não foi possível exportar a apresentação agora." }, { status: 500 });
  }
}
