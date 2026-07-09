import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findDocWithReadAccess,
  checkAcceptingFeedback,
  isDocOwner,
  getAuthenticatedUser,
} from "@/lib/auth";
import { commentIdentity } from "@/lib/identity";
import { notifyOwnerOfComment } from "@/lib/notify";
import { notifyReplySubscribers } from "@/lib/subscriptions";
import { enforceRateLimit, LIMITS } from "@/lib/ratelimit";
import { parseNullableInt } from "@/lib/validation";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const limited = enforceRateLimit(request, LIMITS.commentBatch.bucket, LIMITS.commentBatch.limit, LIMITS.commentBatch.windowMs);
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

  const feedbackCheck = checkAcceptingFeedback(doc);
  if (feedbackCheck) return feedbackCheck;

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.comments) || body.comments.length === 0) {
    return NextResponse.json(
      { error: "comments array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (body.comments.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 comments per batch" },
      { status: 400 }
    );
  }

  // Validate all comments before creating any
  const parsed: { anchorRef: number | null; crossRefLine: number | null }[] = [];
  for (let i = 0; i < body.comments.length; i++) {
    const c = body.comments[i];
    if (!c.body || typeof c.body !== "string") {
      return NextResponse.json(
        { error: `Comment at index ${i}: body is required` },
        { status: 400 }
      );
    }
    const anchorRef = parseNullableInt(c.anchor_ref, "anchor_ref");
    if ("error" in anchorRef) {
      return NextResponse.json(
        { error: `Comment at index ${i}: ${anchorRef.error}` },
        { status: 400 }
      );
    }
    const crossRefLine = parseNullableInt(c.cross_ref_line, "cross_ref_line");
    if ("error" in crossRefLine) {
      return NextResponse.json(
        { error: `Comment at index ${i}: ${crossRefLine.error}` },
        { status: 400 }
      );
    }
    parsed.push({ anchorRef: anchorRef.value, crossRefLine: crossRefLine.value });
  }

  // Validate parent_ids up front (mirrors the single-POST contract): every
  // referenced parent must be an existing comment on THIS doc, so a batch can't
  // thread replies under another doc's comment (which would misattribute the
  // "replies to your comments" badge) or a nonexistent id.
  const parentIds: string[] = [
    ...new Set(
      (body.comments as Array<Record<string, unknown>>)
        .map((c) => c.parent_id)
        .filter((p): p is string => typeof p === "string" && p.length > 0)
    ),
  ];
  if (parentIds.length > 0) {
    const found = await prisma.comment.findMany({
      where: { id: { in: parentIds }, docId: doc.id },
      select: { id: true },
    });
    if (found.length !== parentIds.length) {
      return NextResponse.json(
        { error: "One or more parent_id values are not valid comments on this document" },
        { status: 400 }
      );
    }
  }

  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: doc.id },
    orderBy: { versionNumber: "desc" },
  });

  const user = await getAuthenticatedUser(request);
  const identifier = commentIdentity(request, user);

  try {
    // All-or-nothing: a mid-batch failure must not leave partial comments
    // persisted (which would also mean the owner is notified about a batch that
    // didn't fully land).
    const comments = await prisma.$transaction(
      body.comments.map((c: Record<string, unknown>, i: number) =>
        prisma.comment.create({
          data: {
            docId: doc.id,
            body: c.body as string,
            author: (c.author as string) || "anonymous",
            authorType: c.author_type === "agent" ? "agent" : "human",
            anchorType: (c.anchor_type as string) || null,
            anchorRef: parsed[i].anchorRef,
            anchorText: (c.anchor_text as string) || null,
            docVersion: latestVersion?.versionNumber ?? 1,
            status: "open",
            crossRefSlug: (c.cross_ref_slug as string) || null,
            crossRefLine: parsed[i].crossRefLine,
            parentId: (c.parent_id as string) || null,
            identifier,
          },
        })
      )
    );

    // One notification for the whole batch (debounced anyway), suppressed when
    // the owner posted it. Reuse the already-resolved `user`.
    const postedByOwner = await isDocOwner(request, doc, user);
    await notifyOwnerOfComment(doc, { postedByOwner });

    // Notify reply subscribers, once per distinct parent (per-sub debounce
    // coalesces multiple replies to the same thread). No excludeEmail here: batch
    // has no per-comment opt-in email, so there's no known author to exclude
    // (unlike the single-POST path). Harmless — an agent batch author isn't a
    // human subscriber.
    const notifiedParents = new Set<string>();
    for (const c of comments) {
      if (c.parentId && !notifiedParents.has(c.parentId)) {
        notifiedParents.add(c.parentId);
        await notifyReplySubscribers({ reply: c, doc });
      }
    }

    return NextResponse.json(
      {
        created: comments.length,
        comments: comments.map((c) => ({
          id: c.id,
          body: c.body,
          author: c.author,
          author_type: c.authorType,
          anchor_type: c.anchorType,
          anchor_ref: c.anchorRef,
          anchor_text: c.anchorText,
          doc_version: c.docVersion,
          status: c.status,
          parent_id: c.parentId,
          created_at: c.createdAt.toISOString(),
        })),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create comments" },
      { status: 500 }
    );
  }
}
