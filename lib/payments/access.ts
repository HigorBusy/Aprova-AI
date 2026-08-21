import crypto from "node:crypto";

export type PurchasePlan = {
  planTag: "free" | "premium";
  credits: number;
  label: string;
};

type CaktoPayloadData = {
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

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashActivationCode(email: string, code: string) {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.CAKTO_WEBHOOK_SECRET || "";
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${code.trim()}:${secret}`)
    .digest("hex");
}

export function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function getActivationCodeFromCakto(data: CaktoPayloadData) {
  return String(data.id || data.refId || "").trim();
}

export function detectPurchasePlan(data: CaktoPayloadData): PurchasePlan {
  const offerId = data.offer?.id ?? "";
  const annualOfferId = process.env.CAKTO_ANNUAL_OFFER_ID ?? "";
  const monthlyOfferId = process.env.CAKTO_MONTHLY_OFFER_ID ?? "";
  const oneOffOfferId = process.env.CAKTO_ONE_OFF_OFFER_ID ?? "";

  if (annualOfferId && offerId === annualOfferId) {
    return { planTag: "premium", credits: 3650, label: "Plano anual" };
  }

  if (monthlyOfferId && offerId === monthlyOfferId) {
    return { planTag: "premium", credits: 150, label: "Plano mensal" };
  }

  if (oneOffOfferId && offerId === oneOffOfferId) {
    return { planTag: "premium", credits: 30, label: "Plano avulso" };
  }

  const text = [
    data.product?.name,
    data.offer?.name,
    data.checkoutUrl
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const price = Number(data.offer?.price ?? Number.NaN);

  if (text.includes("anual") || text.includes("ano") || approximately(price, 197)) {
    return { planTag: "premium", credits: 3650, label: "Plano anual" };
  }

  if (text.includes("mensal") || text.includes("mês") || text.includes("mes") || approximately(price, 29.9)) {
    return { planTag: "premium", credits: 150, label: "Plano mensal" };
  }

  return { planTag: "premium", credits: 30, label: "Plano avulso" };
}

function approximately(value: number, expected: number) {
  return Number.isFinite(value) && Math.abs(value - expected) < 0.02;
}

export function getAccessExpiresAt(days = 14) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}
