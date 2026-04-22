import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "./tokens";
import { prisma } from "./prisma";
import { getSessionFromRequest } from "./session";

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

const VERIFICATION_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

/**
 * Get the authenticated user from session cookie or account API key (acct_ prefix).
 * Returns the user or null if not authenticated.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // 1. Check account API key (acct_ prefix in Bearer header)
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (bearerToken?.startsWith("acct_")) {
    const hashed = hashToken(bearerToken);
    const accountKey = await prisma.accountApiKey.findUnique({
      where: { key: hashed },
      include: {
        user: {
          select: { id: true, email: true, emailVerifiedAt: true, createdAt: true },
        },
      },
    });
    if (accountKey) {
      // Update last used timestamp (fire-and-forget)
      prisma.accountApiKey
        .update({ where: { id: accountKey.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});
      return accountKey.user;
    }
  }

  // 2. Check session cookie
  const session = await getSessionFromRequest(request);
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, emailVerifiedAt: true, createdAt: true },
    });
    return user;
  }

  return null;
}

/**
 * Check if an unverified account has exceeded the 24h grace period.
 * Returns true if the account can access private resources.
 */
export function canAccessPrivateResources(user: AuthenticatedUser): boolean {
  if (user.emailVerifiedAt) return true;
  return Date.now() - user.createdAt.getTime() < VERIFICATION_GRACE_PERIOD_MS;
}

/**
 * Check if the authenticated user owns a doc (by userId match).
 */
export async function isAccountOwner(
  request: NextRequest,
  doc: { userId: string | null }
): Promise<boolean> {
  if (!doc.userId) return false;
  const user = await getAuthenticatedUser(request);
  return user?.id === doc.userId;
}

/**
 * Find a doc and authorize read access for feedback endpoints (comments, reactions, reviews).
 * Checks: public visibility, API key (Bearer key_...), magic token (?token= or X-Magic-Token),
 * account API key (Bearer acct_...), or session cookie (account owner).
 */
export async function findDocWithReadAccess(
  slug: string,
  request: NextRequest
): Promise<{ doc: Awaited<ReturnType<typeof prisma.doc.findUnique>>; authorized: boolean }> {
  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) return { doc: null, authorized: false };

  if (doc.visibility === "public") {
    return { doc, authorized: true };
  }

  // Check doc-level API key (key_...)
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerToken && !bearerToken.startsWith("acct_") && doc.apiKey === hashToken(bearerToken)) {
    return { doc, authorized: true };
  }

  // Check magic token (query param or header)
  const magicToken =
    request.headers.get("x-magic-token") ||
    new URL(request.url).searchParams.get("token");
  if (magicToken && doc.magicToken === hashToken(magicToken)) {
    return { doc, authorized: true };
  }

  // Check share token (unhashed, read-only access for private docs)
  const shareToken =
    new URL(request.url).searchParams.get("share_token") ||
    request.headers.get("x-share-token");
  if (shareToken && doc.shareToken === shareToken) {
    return { doc, authorized: true };
  }

  // Check account ownership (acct_ key or session cookie)
  if (doc.userId) {
    const user = await getAuthenticatedUser(request);
    if (user?.id === doc.userId) {
      return { doc, authorized: true };
    }
  }

  return { doc, authorized: false };
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
