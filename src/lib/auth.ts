import { NextRequest } from "next/server";
import { hashToken } from "./tokens";
import { prisma } from "./prisma";

type AuthResult =
  | { authorized: true; doc: Awaited<ReturnType<typeof prisma.doc.findUnique>> }
  | { authorized: false; error: string; status: number };

export async function authorizeWithMagicToken(
  request: NextRequest,
  slug: string
): Promise<AuthResult> {
  const magicToken =
    request.headers.get("x-magic-token") ||
    new URL(request.url).searchParams.get("token");

  if (!magicToken) {
    return { authorized: false, error: "Magic token required", status: 401 };
  }

  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) {
    return { authorized: false, error: "Document not found", status: 404 };
  }

  if (doc.magicToken !== hashToken(magicToken)) {
    return { authorized: false, error: "Invalid magic token", status: 403 };
  }

  return { authorized: true, doc };
}

export async function authorizeWithApiKey(
  request: NextRequest,
  slug: string
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!apiKey) {
    return { authorized: false, error: "API key required", status: 401 };
  }

  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) {
    return { authorized: false, error: "Document not found", status: 404 };
  }

  if (doc.apiKey !== hashToken(apiKey)) {
    return { authorized: false, error: "Invalid API key", status: 403 };
  }

  return { authorized: true, doc };
}
