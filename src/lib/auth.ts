import { NextRequest, NextResponse } from "next/server";
import { hashToken, safeCompare } from "./tokens";
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
  // All magic-token sources are checked independently so a stray/wrong ?token=
  // in the URL can't shadow a valid header or cookie.
  const candidates = [
    request.headers.get("x-magic-token"),
    new URL(request.url).searchParams.get("token"),
    request.cookies.get(`dm_tok_${slug}`)?.value ?? null,
  ].filter((t): t is string => !!t);

  if (candidates.length === 0) {
    return { authorized: false, error: "Magic token required", status: 401 };
  }

  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) {
    return { authorized: false, error: "Document not found", status: 404 };
  }

  if (!candidates.some((t) => doc.magicToken === hashToken(t))) {
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
 * True when the request is made by the doc's owner — either a valid magic token
 * holder (any independent source: header, ?token=, or the per-doc cookie) or the
 * authenticated account owner. Used to suppress self-notifications: don't email
 * an owner about a comment they posted themselves.
 */
export async function isDocOwner(
  request: NextRequest,
  doc: { slug: string; magicToken: string; userId: string | null },
  // Callers that already resolved the authenticated user pass it here to avoid a
  // second getAuthenticatedUser round-trip (and duplicate API-key lastUsedAt writes).
  resolvedUser?: AuthenticatedUser | null
): Promise<boolean> {
  const url = new URL(request.url);
  const magicCandidates = [
    request.headers.get("x-magic-token"),
    url.searchParams.get("token"),
    request.cookies.get(`dm_tok_${doc.slug}`)?.value ?? null,
  ].filter((t): t is string => !!t);
  if (magicCandidates.some((t) => doc.magicToken === hashToken(t))) return true;

  if (doc.userId) {
    const user =
      resolvedUser !== undefined ? resolvedUser : await getAuthenticatedUser(request);
    if (user?.id === doc.userId) return true;
  }
  return false;
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

  // Check magic token from any independent source (header, query param, or the
  // httpOnly per-doc cookie set by the middleware token->cookie exchange) so a
  // stray/wrong ?token= can't shadow a valid cookie.
  const url = new URL(request.url);
  const magicCandidates = [
    request.headers.get("x-magic-token"),
    url.searchParams.get("token"),
    request.cookies.get(`dm_tok_${slug}`)?.value ?? null,
  ].filter((t): t is string => !!t);
  if (magicCandidates.some((t) => doc.magicToken === hashToken(t))) {
    return { doc, authorized: true };
  }

  // Check share token (unhashed, read-only access for private docs). Dedicated
  // share_token param / X-Share-Token header are matched directly; the generic
  // ?token= / X-Magic-Token sources only count as a share token when they carry
  // the share_ prefix. This mirrors the /docs/:slug GET owner-vs-share split so
  // the two access paths can't diverge, and the prefix gate means a magic token
  // on ?token= can never be misread here (it's already been checked above). The
  // share token is stored unhashed, so compare it in constant time.
  const shareCandidates = [
    url.searchParams.get("share_token"),
    request.headers.get("x-share-token"),
    ...[url.searchParams.get("token"), request.headers.get("x-magic-token")].filter(
      (t): t is string => !!t && t.startsWith("share_")
    ),
  ].filter((t): t is string => !!t);
  const storedShareToken = doc.shareToken;
  if (storedShareToken && shareCandidates.some((t) => safeCompare(storedShareToken, t))) {
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
