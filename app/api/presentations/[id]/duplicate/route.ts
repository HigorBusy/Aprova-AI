import type { NextRequest } from "next/server";

import { presentationsDisabledResponse } from "@/lib/feature-access";
import { jsonUtf8 } from "@/lib/security/request";
import { authenticateRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const disabled = presentationsDisabledResponse();
  if (disabled) return disabled;

  const auth = await authenticateRequest(request);
  if (!auth) return jsonUtf8({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("duplicate_presentation", { p_presentation_id: context.params.id });
  if (error || typeof data !== "string") return jsonUtf8({ error: "Não foi possível duplicar esta apresentação." }, { status: 500 });
  return jsonUtf8({ presentationId: data });
}
