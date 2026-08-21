import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  detectPurchasePlan,
  getAccessExpiresAt,
  getActivationCodeFromCakto,
  hashActivationCode,
  normalizeEmail
} from "@/lib/payments/access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CaktoWebhookPayload = {
  secret?: string;
  event?: string;
  data?: {
    id?: string;
    refId?: string;
    checkoutUrl?: string;
    customer?: {
      name?: string;
      email?: string;
    };
    product?: {
      id?: string;
      short_id?: string;
      name?: string;
    };
    offer?: {
      id?: string;
      name?: string;
      price?: number | string;
    };
    subscription?: unknown;
  };
};

const ACTIVATION_EVENTS = new Set(["purchase_approved", "subscription_created", "subscription_renewed"]);
const REVOCATION_EVENTS = new Set(["refund", "chargeback", "subscription_canceled", "subscription_paused"]);

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CaktoWebhookPayload | null;
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  const supabase = getSupabaseAdminClient();

  if (!payload || !secret || !supabase) {
    return webhookResponse({ ok: false }, 500);
  }

  if (!isFromCakto(payload.secret ?? "", secret)) {
    return webhookResponse({ ok: false }, 401);
  }

  const event = payload.event ?? "";
  const data = payload.data;
  const orderId = data?.id;

  if (!event || !data || !orderId) {
    return webhookResponse({ ok: true, ignored: true }, 200);
  }

  const eventKey = `${event}:${orderId}`;
  const { error: eventError } = await supabase
    .from("cakto_webhook_events")
    .insert({
      event_key: eventKey,
      event,
      order_id: orderId,
      payload
    });

  if (eventError?.code === "23505") {
    const { data: previousEvent } = await supabase
      .from("cakto_webhook_events")
      .select("processed_at")
      .eq("event_key", eventKey)
      .maybeSingle<{ processed_at: string | null }>();

    if (previousEvent?.processed_at) {
      return webhookResponse({ ok: true, duplicate: true }, 200);
    }
  }

  if (eventError && eventError.code !== "23505") {
    return webhookResponse({ ok: false }, 500);
  }

  try {
    if (ACTIVATION_EVENTS.has(event)) {
      const email = normalizeEmail(data.customer?.email ?? "");
      const activationCode = getActivationCodeFromCakto(data);
      const plan = detectPurchasePlan(data);

      if (!email || !activationCode) {
        throw new Error("Cakto payload without customer email or activation code");
      }

      const { data: existingAccess } = await supabase
        .from("purchase_accesses")
        .select("status")
        .eq("order_id", orderId)
        .maybeSingle<{ status: string }>();

      const accessPayload = {
        email,
        customer_name: data.customer?.name ?? null,
        order_id: orderId,
        ref_id: data.refId ?? null,
        activation_code_hash: hashActivationCode(email, activationCode),
        product_id: data.product?.id ?? null,
        product_name: data.product?.name ?? null,
        offer_id: data.offer?.id ?? null,
        offer_name: data.offer?.name ?? null,
        plan_tag: plan.planTag,
        credits: plan.credits,
        raw_event: payload,
        updated_at: new Date().toISOString(),
        ...(existingAccess?.status === "claimed"
          ? {}
          : { status: "pending", expires_at: getAccessExpiresAt() })
      };

      const { error } = await supabase
        .from("purchase_accesses")
        .upsert(accessPayload, { onConflict: "order_id" });

      if (error) throw new Error("Could not register purchase access");
    }

    if (REVOCATION_EVENTS.has(event)) {
      const { error } = await supabase.rpc("revoke_purchase_access", {
        p_order_id: orderId,
        p_payload: payload
      });

      if (error) throw new Error("Could not revoke purchase access");
    }

    await supabase
      .from("cakto_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("event_key", eventKey);

    return webhookResponse({ ok: true }, 200);
  } catch (error) {
    await supabase
      .from("cakto_webhook_events")
      .update({ processing_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error" })
      .eq("event_key", eventKey);

    return webhookResponse({ ok: false }, 500);
  }
}

function isFromCakto(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function webhookResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}
