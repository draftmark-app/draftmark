import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorizeWithMagicToken,
  getAuthenticatedUser,
  canAccessPrivateResources,
  getDocAccessForRequest,
} from "@/lib/auth";
import { generateShareToken } from "@/lib/tokens";
import { extractTitleFromContent } from "@/lib/markdown";
import { generateSeoSlug } from "@/lib/slug";
import { buildOkfConceptDoc } from "@/lib/okf";
import { validateContent, validateTitle, validateVersionNote } from "@/lib/validation";

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

  // Owner vs reviewer access is resolved by the shared evaluator so this route
  // and the feedback endpoints (and the share page) can't drift.
  const { access, user } = await getDocAccessForRequest(request, doc);
  const isOwner = access.owner;

  // Suspended account (unverified >24h) loses private doc access, unless the
  // request also presented a valid magic token.
  if (
    doc.visibility === "private" &&
    access.accountOwner &&
    !access.ownerByMagic &&
    user &&
    !canAccessPrivateResources(user)
  ) {
    return NextResponse.json(
      { error: "Email verification required. Verify your email to continue accessing private documents." },
      { status: 403 }
    );
  }

  if (!access.readable) {
    return NextResponse.json(
      { error: "This document is private. Provide a valid token or API key." },
      { status: 401 }
    );
  }

  const servedContent = doc.content;

  // Support ?format=raw or /share/{slug}.md (via middleware x-format header)
  const format = new URL(request.url).searchParams.get("format") || request.headers.get("x-format");
  if (format === "raw") {
    return new Response(servedContent, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  // Support ?format=okf or /share/{slug}.okf.md — an OKF v0.1 concept document
  // (synthesized YAML frontmatter + raw body). Runs after the auth gate above,
  // so a private doc's synthesized frontmatter is never exposed unauthorized.
  if (format === "okf") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    return new Response(buildOkfConceptDoc({ ...doc, content: servedContent }, baseUrl), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
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

  // Base response for all access levels (reviewer-safe)
  const response: Record<string, unknown> = {
    slug: doc.slug,
    title: doc.title,
    content: servedContent,
    visibility: doc.visibility,
    status: doc.status,
    expected_reviews: doc.expectedReviews,
    review_deadline: doc.reviewDeadline?.toISOString() ?? null,
    review_complete: reviewComplete,
    review_expired: reviewExpired,
    accepting_feedback: acceptingFeedback,
    reactions_count: reactionCounts,
    comments_count: doc._count.comments,
    reviews_count: reviewsCount,
    reviews: doc.reviews.map((r) => ({
      reviewer_name: r.reviewerName,
      reviewed_at: r.createdAt.toISOString(),
    })),
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };

  // Owner-only fields (visible only with magic_token)
  if (isOwner) {
    response.views_count = doc.viewsCount;
    response.meta = doc.meta;
    if (doc.visibility === "private" && doc.shareToken) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
      response.share_token = doc.shareToken;
      response.share_url = `${baseUrl}/share/${doc.slug}?share_token=${encodeURIComponent(doc.shareToken)}`;
    }
  }

  return NextResponse.json(response);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Try magic token first, then fall back to account ownership
  let ownerDoc: Awaited<ReturnType<typeof prisma.doc.findUnique>> = null;
  const auth = await authorizeWithMagicToken(request, slug);
  if (auth.authorized) {
    ownerDoc = auth.doc;
  } else {
    // Check account ownership as alternative
    const doc = await prisma.doc.findUnique({ where: { slug } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const user = await getAuthenticatedUser(request);
    if (!user || !doc.userId || user.id !== doc.userId) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    ownerDoc = doc;
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Request body required" }, { status: 400 });
  }

  const { content, title, visibility, version_note, status, expected_reviews, review_deadline } = body;

  const validationError =
    (content !== undefined ? validateContent(content) : null) ??
    (title !== undefined ? validateTitle(title) : null) ??
    (version_note !== undefined ? validateVersionNote(version_note) : null);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Get current version number
  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: ownerDoc!.id },
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
    // Generate share token when switching to private (if not already set)
    if (visibility === "private" && !ownerDoc!.shareToken) {
      updateData.shareToken = generateShareToken();
    }
    // Retract the public SEO slug when going private so it no longer resolves
    // via /public/[seoSlug] or its OG image.
    if (visibility === "private") {
      updateData.seoSlug = null;
    }
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
  if (content && !title && !ownerDoc!.title) {
    updateData.title = extractTitleFromContent(content) || null;
  }

  // Regenerate SEO slug if title changed and doc is public
  const newTitle = (updateData.title as string | undefined) ?? ownerDoc!.title;
  const newVisibility = (updateData.visibility as string | undefined) ?? ownerDoc!.visibility;
  if ((title !== undefined || visibility !== undefined) && newTitle && newVisibility === "public") {
    updateData.seoSlug = await generateSeoSlug(newTitle, slug);
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

  const patchResponse: Record<string, unknown> = {
    slug: doc.slug,
    title: doc.title,
    content: doc.content,
    visibility: doc.visibility,
    status: doc.status,
    expected_reviews: doc.expectedReviews,
    review_deadline: doc.reviewDeadline?.toISOString() ?? null,
    updated_at: doc.updatedAt.toISOString(),
  };

  // Include share_url when doc is private and has a share token
  if (doc.visibility === "private" && doc.shareToken) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    patchResponse.share_token = doc.shareToken;
    patchResponse.share_url = `${baseUrl}/share/${doc.slug}?share_token=${encodeURIComponent(doc.shareToken)}`;
  }

  return NextResponse.json(patchResponse);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Try magic token first, then fall back to account ownership
  const auth = await authorizeWithMagicToken(request, slug);
  if (!auth.authorized) {
    const doc = await prisma.doc.findUnique({ where: { slug } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const user = await getAuthenticatedUser(request);
    if (!user || !doc.userId || user.id !== doc.userId) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  await prisma.doc.delete({ where: { slug } });

  return NextResponse.json({ deleted: true });
}
