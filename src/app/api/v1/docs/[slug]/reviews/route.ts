import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDocWithReadAccess, checkAcceptingFeedback, getAuthenticatedUser } from "@/lib/auth";
import { feedbackIdentity } from "@/lib/identity";
import { enforceRateLimit, LIMITS } from "@/lib/ratelimit";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const { doc, authorized } = await findDocWithReadAccess(slug, request);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "API key required for private documents" },
      { status: 401 }
    );
  }

  const reviews = await prisma.review.findMany({
    where: { docId: doc.id },
    orderBy: { createdAt: "asc" },
  });

  // Derive the requester's identity the same way POST does, so we can flag the
  // caller's own review ("your review") without exposing the raw identifier.
  // Mirrors the comments endpoint and powers self-notification suppression in
  // polling clients (e.g. the VS Code extension).
  const user = await getAuthenticatedUser(request);
  const me = user ? `acct:${user.id}` : feedbackIdentity(request);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      reviewer_name: r.reviewerName,
      reviewer_type: r.reviewerType,
      mine: !!me && r.identifier === me,
      created_at: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const limited = enforceRateLimit(request, LIMITS.review.bucket, LIMITS.review.limit, LIMITS.review.windowMs);
  if (limited) return limited;

  const { doc, authorized } = await findDocWithReadAccess(slug, request);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "API key required for private documents" },
      { status: 401 }
    );
  }

  // Check if doc is accepting feedback
  const feedbackCheck = checkAcceptingFeedback(doc);
  if (feedbackCheck) return feedbackCheck;

  const body = (await request.json().catch(() => null)) ?? {};

  // Dedup identity is derived server-side, never from the client, so a caller
  // can't mint unlimited reviews (and flip review_complete) by varying a
  // localStorage id. Authenticated callers dedup by account; anonymous by IP.
  const user = await getAuthenticatedUser(request);
  const identifier = user ? `acct:${user.id}` : feedbackIdentity(request);

  // Upsert: one review per identity per doc
  const review = await prisma.review.upsert({
    where: {
      docId_identifier: {
        docId: doc.id,
        identifier,
      },
    },
    update: {},
    create: {
      docId: doc.id,
      reviewerName: body.reviewer_name || "anonymous",
      reviewerType: body.reviewer_type === "agent" ? "agent" : "human",
      identifier,
    },
  });

  return NextResponse.json(
    {
      id: review.id,
      reviewer_name: review.reviewerName,
      reviewer_type: review.reviewerType,
      created_at: review.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
