import { createHmac, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { normalizeEssayReview, type RawEssayReview } from "@/lib/ai/essay-review";
import { callGroq, parseJsonResponse } from "@/lib/ai/groq";
import { sanitizeSingleLine, sanitizeTextInput } from "@/lib/security/input";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { rejectLargeRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const TRIAL_COOKIE = "aprovai_free_trial_v1";
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{20,100}$/;
const PUBLIC_REVIEW_PROMPT = `Você é um corretor experiente de redação do ENEM. Avalie somente o texto e o tema enviados.
Seja rigoroso, específico e não invente evidências. Cada competência vale de 0 a 200 e a nota total deve ser a soma exata.
C1: norma padrão. C2: tema e repertório produtivo. C3: argumentação. C4: coesão. C5: proposta de intervenção.
Redação curta, genérica, sem repertório ou sem intervenção completa não pode receber nota alta.
Responda somente com JSON válido e compacto, sem markdown, usando exatamente esta estrutura:
{"type":"essay_review","nota_total":0,"nota_competencia_1":0,"nota_competencia_2":0,"nota_competencia_3":0,"nota_competencia_4":0,"nota_competencia_5":0,"diagnostico_geral":"","principais_erros":[""],"pontos_fortes":[""],"plano_de_melhoria":[""],"proxima_tarefa_recomendada":"","competencias":{"c1":{"score":0,"justificativa":""},"c2":{"score":0,"justificativa":""},"c3":{"score":0,"justificativa":""},"c4":{"score":0,"justificativa":""},"c5":{"score":0,"justificativa":""}}}
Limite cada justificativa a 180 caracteres, o diagnóstico a 300 e cada lista a no máximo 3 itens.`;

export async function POST(request: NextRequest) {
  const oversized = rejectLargeRequest(request, 160 * 1024);
  if (oversized) return oversized;

  const secret = process.env.ACCESS_TOKEN_SECRET;
  const supabase = getSupabaseAdminClient();
  if (!secret || !supabase) {
    return json({ error: "A correção gratuita está temporariamente indisponível." }, 503);
  }

  let body: { essay?: unknown; theme?: unknown; deviceId?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  const essay = typeof body.essay === "string" ? sanitizeTextInput(body.essay, 30_000) : "";
  const theme = typeof body.theme === "string" ? sanitizeSingleLine(body.theme, 300) : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (essay.length < 50 || essay.length > 30_000) {
    return json({ error: "Cole uma redação entre 50 e 30.000 caracteres." }, 400);
  }
  if (theme.length < 8) {
    return json({ error: "Informe o tema proposto para avaliar a Competência 2." }, 400);
  }
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    return json({ error: "Não foi possível validar este dispositivo." }, 400);
  }

  const ip = getClientIp(request);
  const ipHash = hashIdentity(secret, `ip:${ip}`);
  const rateLimit = checkRateLimit(`public-essay:${ipHash}`, 4, 10 * 60_000);
  if (!rateLimit.allowed) {
    const limited = rateLimitResponse(rateLimit.resetAt);
    return NextResponse.json(limited.body, limited.init);
  }

  const cookieToken = request.cookies.get(TRIAL_COOKIE)?.value ?? randomBytes(32).toString("base64url");
  const deviceHash = hashIdentity(secret, `device:${deviceId}`);
  const cookieHash = hashIdentity(secret, `cookie:${cookieToken}`);
  const userAgentHash = hashIdentity(secret, `ua:${request.headers.get("user-agent") ?? "unknown"}`);

  const { data: claimData, error: claimError } = await supabase.rpc("claim_free_essay_trial", {
    p_device_hash: deviceHash,
    p_cookie_hash: cookieHash,
    p_ip_hash: ipHash,
    p_user_agent_hash: userAgentHash
  });
  const claim = Array.isArray(claimData) ? claimData[0] : claimData;

  if (claimError) {
    console.error("Free essay trial claim failed", { code: claimError.code, message: claimError.message });
    return json({ error: "Não foi possível iniciar sua correção gratuita agora." }, 502);
  }
  if (!claim?.success || !claim.trial_id) {
    const message = claim?.reason === "network_limit_reached"
      ? "O limite de testes gratuitos desta rede foi atingido."
      : "A correção gratuita deste dispositivo já foi utilizada.";
    return withTrialCookie(json({ error: message, trialUsed: true }, 409), cookieToken);
  }

  const trialId = String(claim.trial_id);
  try {
    const rawReview = await callGroq(
      [
        { role: "system", content: PUBLIC_REVIEW_PROMPT },
        {
          role: "user",
          content: `Corrija esta redação com rigor de banca ENEM. Compare o texto ao tema proposto e responda no JSON solicitado. Toda crítica deve citar evidência real do texto.\n\nTEMA PROPOSTO:\n${theme}\n\nREDAÇÃO DO ALUNO:\n${essay}`
        }
      ],
      { temperature: 0.2, maxTokens: 1_400, json: true }
    );
    const review = normalizeEssayReview(parseJsonResponse<RawEssayReview>(rawReview), essay);

    const { error: updateError } = await supabase
      .from("free_essay_trials")
      .update({
        status: "completed",
        theme,
        score: review.estimatedScore,
        completed_at: new Date().toISOString()
      })
      .eq("id", trialId);
    if (updateError) throw updateError;

    return withTrialCookie(NextResponse.json({ review, trialUsed: true }), cookieToken);
  } catch (error) {
    await supabase.from("free_essay_trials").delete().eq("id", trialId).eq("status", "pending");
    console.error("Free essay trial failed", {
      trialId,
      reason: error instanceof Error ? error.message : "unknown"
    });
    return json({ error: "Não foi possível concluir a correção agora. Seu teste continua disponível." }, 502);
  }
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function hashIdentity(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function withTrialCookie(response: NextResponse, token: string) {
  response.cookies.set(TRIAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
