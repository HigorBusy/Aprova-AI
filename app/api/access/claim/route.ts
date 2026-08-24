import { NextResponse } from "next/server";

import { hashActivationCode, normalizeEmail, safeCompare } from "@/lib/payments/access";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { sanitizeSingleLine } from "@/lib/security/input";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ClaimPayload = {
  email?: string;
  code?: string;
  password?: string;
  name?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ClaimPayload | null;
  const supabase = getSupabaseAdminClient();
  const clientAddress = getClientAddress(request);

  const rateLimit = checkRateLimit(`purchase-claim:${clientAddress}`, 8, 15 * 60_000);
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit.resetAt);
    return NextResponse.json(response.body, response.init);
  }

  if (!supabase) {
    return noStoreResponse({ error: "Configuração de acesso indisponível." }, 500);
  }

  const email = normalizeEmail(body?.email ?? "");
  const code = sanitizeSingleLine(String(body?.code ?? ""), 80);
  const password = String(body?.password ?? "");
  const name = sanitizeSingleLine(String(body?.name ?? ""), 120) || "Candidato";

  if (!isValidEmail(email) || !code || password.length < 8 || password.length > 128) {
    return noStoreResponse(
      { error: "Informe e-mail, código da compra e uma senha com pelo menos 8 caracteres." },
      400
    );
  }

  const { data: accesses, error: accessError } = await supabase
    .from("purchase_accesses")
    .select("*")
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (accessError) {
    return noStoreResponse({ error: "Não foi possível validar sua compra agora." }, 500);
  }

  const incomingHash = hashActivationCode(email, code);
  const access = accesses?.find((item) =>
    safeCompare(item.activation_code_hash, incomingHash) ||
    matchesPurchaseCode(item.order_id, code) ||
    matchesPurchaseCode(item.ref_id, code)
  );

  if (!access) {
    return noStoreResponse({ error: "Compra não encontrada ou código inválido." }, 404);
  }

  const existingUser = await findUserByEmail(email);
  let userId = existingUser?.id;
  let createdAccount = false;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { access_source: "cakto_payment" },
      user_metadata: { full_name: name }
    });

    if (error || !data.user) {
      return noStoreResponse({ error: "Não foi possível criar sua conta agora." }, 500);
    }

    userId = data.user.id;
    createdAccount = true;
  }

  const { error: claimError } = await supabase.rpc("claim_purchase_access", {
    p_access_id: access.id,
    p_user_id: userId,
    p_email: email,
    p_name: name
  });

  if (claimError) {
    return noStoreResponse(
      {
        error: claimError.message.includes("purchase_access_not_claimable")
          ? "Esta compra já foi ativada ou expirou."
          : "Não foi possível concluir a ativação agora. Tente novamente."
      },
      claimError.message.includes("purchase_access_not_claimable") ? 409 : 500
    );
  }

  return noStoreResponse(
    {
      ok: true,
      createdAccount,
      message: createdAccount
        ? "Conta criada. Faça login para entrar no Pontuei."
        : "Compra vinculada à sua conta existente. Use sua senha atual para entrar."
    },
    200
  );
}

function matchesPurchaseCode(stored: unknown, received: string) {
  if (typeof stored !== "string") return false;
  const normalized = stored.trim();
  return normalized.length > 0 && safeCompare(normalized, received.trim());
}

async function findUserByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) return null;

    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;

    if (data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function noStoreResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}
