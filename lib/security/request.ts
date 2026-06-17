import { NextRequest, NextResponse } from "next/server";

export function rejectLargeRequest(request: NextRequest, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return null;

  const parsedLength = Number(contentLength);
  if (!Number.isFinite(parsedLength) || parsedLength <= maxBytes) return null;

  return NextResponse.json(
    { error: "Requisicao muito grande." },
    { status: 413 }
  );
}
