import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

import { presentationsDisabledResponse } from "@/lib/feature-access";
import { jsonUtf8, rejectLargeRequest } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const largeRequest = rejectLargeRequest(request, 2_000);
  if (largeRequest) return largeRequest;

  const body = await request.json().catch(() => null) as { enabled?: unknown } | null;
  if (typeof body?.enabled !== "boolean") return jsonUtf8({ error: "Estado de compartilhamento inválido." }, { status: 400 });

  const { data: current } = await auth.supabase
    .from("presentations")
    .select("share_token, status")
    .eq("id", context.params.id)
    .eq("user_id", auth.user.id)
    .maybeSingle<{ share_token: string | null; status: string }>();
  if (!current || current.status !== "generated") return jsonUtf8({ error: "Apresentação não encontrada." }, { status: 404 });

  const token = current.share_token ?? randomUUID();
  const { error } = await auth.supabase
    .from("presentations")
    .update({ share_token: token, is_public: body.enabled, shared_at: body.enabled ? new Date().toISOString() : null })
    .eq("id", context.params.id)
    .eq("user_id", auth.user.id);
  if (error) return jsonUtf8({ error: "Não foi possível alterar o compartilhamento." }, { status: 500 });

  return jsonUtf8({ enabled: body.enabled, url: body.enabled ? `${request.nextUrl.origin}/apresentacoes/compartilhada/${token}` : null });
}
