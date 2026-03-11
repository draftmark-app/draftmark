import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithMagicToken } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";
import { extractTitleFromContent } from "@/lib/markdown";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const doc = await prisma.doc.findUnique({
    where: { slug },
    include: {
      reactions: true,
      reviews: { select: { reviewerName: true, createdAt: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.visibility === "private") {
    // Check for magic_token in URL or api_key in header
    const tokenParam = new URL(request.url).searchParams.get("token");
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const validToken = tokenParam && doc.magicToken === hashToken(tokenParam);
    const validKey = apiKey && doc.apiKey === hashToken(apiKey);

    if (!validToken && !validKey) {
      return NextResponse.json(
        { error: "This document is private. Provide a valid token or API key." },
        { status: 401 }
      );
    }
  }

  // Aggregate reaction counts
  const reactionCounts: Record<string, number> = {};
  for (const r of doc.reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  }

  // Computed review lifecycle fields
  const reviewsCount = doc.reviews.length;
  const reviewComplete = doc.expectedReviews != null && reviewsCount >= doc.expectedReviews;
  const reviewExpired = doc.reviewDeadline != null && new Date() > doc.reviewDeadline;
  const acceptingFeedback = doc.status !== "review_closed" && !reviewExpired;

  return NextResponse.json({
    slug: doc.slug,
    title: doc.title,
    content: doc.content,
    visibility: doc.visibility,
    status: doc.status,
    expected_reviews: doc.expectedReviews,
    review_deadline: doc.reviewDeadline?.toISOString() ?? null,
    review_complete: reviewComplete,
    review_expired: reviewExpired,
    accepting_feedback: acceptingFeedback,
    views_count: doc.viewsCount,
    reactions_count: reactionCounts,
    comments_count: doc._count.comments,
    reviews_count: reviewsCount,
    reviews: doc.reviews.map((r) => ({
      reviewer_name: r.reviewerName,
      reviewed_at: r.createdAt.toISOString(),
    })),
    meta: doc.meta,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const auth = await authorizeWithMagicToken(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Request body required" }, { status: 400 });
  }

  const { content, title, visibility, version_note, status, expected_reviews, review_deadline } = body;

  // Get current version number
  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: auth.doc!.id },
    orderBy: { versionNumber: "desc" },
  });
  const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

  const updateData: Record<string, unknown> = {};
  if (content !== undefined) updateData.content = content;
  if (title !== undefined) updateData.title = title;
  if (visibility !== undefined) {
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json(
        { error: "Visibility must be 'public' or 'private'" },
        { status: 400 }
      );
    }
    updateData.visibility = visibility;
  }
  if (status !== undefined) {
    if (status !== "open" && status !== "review_closed") {
      return NextResponse.json(
        { error: "Status must be 'open' or 'review_closed'" },
        { status: 400 }
      );
    }
    updateData.status = status;
  }
  if (expected_reviews !== undefined) {
    if (expected_reviews !== null && (!Number.isInteger(expected_reviews) || expected_reviews < 1)) {
      return NextResponse.json(
        { error: "expected_reviews must be a positive integer or null" },
        { status: 400 }
      );
    }
    updateData.expectedReviews = expected_reviews;
  }
  if (review_deadline !== undefined) {
    if (review_deadline !== null) {
      const deadline = new Date(review_deadline);
      if (isNaN(deadline.getTime())) {
        return NextResponse.json(
          { error: "review_deadline must be a valid ISO 8601 date or null" },
          { status: 400 }
        );
      }
      updateData.reviewDeadline = deadline;
    } else {
      updateData.reviewDeadline = null;
    }
  }

  // Auto-extract title from content if title is being cleared or content changed
  if (content && !title && !auth.doc!.title) {
    updateData.title = extractTitleFromContent(content) || null;
  }

  const doc = await prisma.doc.update({
    where: { slug },
    data: updateData,
  });

  // Create new version if content changed
  if (content !== undefined) {
    await prisma.docVersion.create({
      data: {
        docId: doc.id,
        content,
        versionNote: version_note || null,
        versionNumber: nextVersion,
      },
    });
  }

  return NextResponse.json({
    slug: doc.slug,
    title: doc.title,
    content: doc.content,
    visibility: doc.visibility,
    status: doc.status,
    expected_reviews: doc.expectedReviews,
    review_deadline: doc.reviewDeadline?.toISOString() ?? null,
    updated_at: doc.updatedAt.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const auth = await authorizeWithMagicToken(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await prisma.doc.delete({ where: { slug } });

  return NextResponse.json({ deleted: true });
}
