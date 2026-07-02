import { NextRequest, NextResponse } from "next/server";

const JSON_UTF8_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export function jsonUtf8<TBody>(body: TBody, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", JSON_UTF8_HEADERS["Content-Type"]);

  return NextResponse.json(body, {
    ...init,
    headers
  });
}

export function rejectLargeRequest(request: NextRequest, maxBytes: number) {
  const length = request.headers.get("content-length");
  if (!length) return null;

  const bytes = Number(length);
  if (!Number.isFinite(bytes) || bytes <= maxBytes) return null;

  return jsonUtf8(
    { error: "Arquivo ou mensagem acima do limite permitido." },
    { status: 413 }
  );
}
