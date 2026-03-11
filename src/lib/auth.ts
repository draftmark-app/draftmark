import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "./tokens";
import { prisma } from "./prisma";

type AuthResult =
  | { authorized: true; doc: Awaited<ReturnType<typeof prisma.doc.findUnique>> }
  | { authorized: false; error: string; status: number };

type CollectionAuthResult =
  | { authorized: true; collection: Awaited<ReturnType<typeof prisma.collection.findUnique>> }
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

export async function authorizeCollectionWithMagicToken(
  request: NextRequest,
  slug: string
): Promise<CollectionAuthResult> {
  const magicToken =
    request.headers.get("x-magic-token") ||
    new URL(request.url).searchParams.get("token");

  if (!magicToken) {
    return { authorized: false, error: "Magic token required", status: 401 };
  }

  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) {
    return { authorized: false, error: "Collection not found", status: 404 };
  }

  if (collection.magicToken !== hashToken(magicToken)) {
    return { authorized: false, error: "Invalid magic token", status: 403 };
  }

  return { authorized: true, collection };
}

/**
 * Check if a doc is currently accepting feedback (comments, reactions, reviews).
 * Returns null if accepting, or a NextResponse with 409 if not.
 */
export function checkAcceptingFeedback(doc: {
  status: string;
  reviewDeadline: Date | null;
}): NextResponse | null {
  if (doc.status === "review_closed") {
    return NextResponse.json(
      { error: "This document is no longer accepting feedback (review closed)" },
      { status: 409 }
    );
  }

  if (doc.reviewDeadline && new Date() > doc.reviewDeadline) {
    return NextResponse.json(
      { error: "This document is no longer accepting feedback (review deadline passed)" },
      { status: 409 }
    );
  }

  return null;
}
