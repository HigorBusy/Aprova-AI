import type { NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function rateLimitResponse(resetAt: number): Parameters<typeof NextResponse.json>[1] & { body: { error: string } } {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return {
    body: { error: "Muitas requisicoes em pouco tempo. Tente novamente em instantes." },
    status: 429,
    headers: { "Retry-After": String(retryAfter) }
  };
}

function pruneBuckets(now: number) {
  if (buckets.size < 500) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
