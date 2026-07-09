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
import { createReplySubscription, notifyReplySubscribers } from "@/lib/subscriptions";
import { enforceRateLimit, LIMITS } from "@/lib/ratelimit";
import { parseNullableInt } from "@/lib/validation";

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

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { docId: doc.id };
  if (status) {
    where.status = status;
  }

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // Derive the requester's identity so we can flag which comments are theirs
  // ("your comments") without ever exposing the raw identifier. This powers the
  // client-side "new replies to your comments" badge.
  const user = await getAuthenticatedUser(request);
  const me = commentIdentity(request, user);

  return NextResponse.json({
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
      cross_ref_slug: c.crossRefSlug,
      cross_ref_line: c.crossRefLine,
      parent_id: c.parentId,
      mine: !!me && c.identifier === me,
      created_at: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const limited = enforceRateLimit(request, LIMITS.comment.bucket, LIMITS.comment.limit, LIMITS.comment.windowMs);
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

  const body = await request.json().catch(() => null);
  if (!body || !body.body || typeof body.body !== "string") {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 }
    );
  }

  // anchor_ref/cross_ref_line map to Int columns — validate before the
  // Prisma write so a bad value (e.g. selection text sent in anchor_ref by
  // a buggy client) returns a clear 400 instead of an unhandled 500.
  const anchorRef = parseNullableInt(body.anchor_ref, "anchor_ref");
  if ("error" in anchorRef) {
    return NextResponse.json({ error: anchorRef.error }, { status: 400 });
  }
  const crossRefLine = parseNullableInt(body.cross_ref_line, "cross_ref_line");
  if ("error" in crossRefLine) {
    return NextResponse.json({ error: crossRefLine.error }, { status: 400 });
  }

  // Get current version number
  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: doc.id },
    orderBy: { versionNumber: "desc" },
  });

  // Validate parent_id if provided
  if (body.parent_id) {
    const parent = await prisma.comment.findFirst({
      where: { id: body.parent_id, docId: doc.id },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 400 }
      );
    }
  }

  const user = await getAuthenticatedUser(request);
  const comment = await prisma.comment.create({
    data: {
      docId: doc.id,
      body: body.body,
      author: body.author || "anonymous",
      authorType: body.author_type === "agent" ? "agent" : "human",
      anchorType: body.anchor_type || null,
      anchorRef: anchorRef.value,
      anchorText: body.anchor_text || null,
      docVersion: latestVersion?.versionNumber ?? 1,
      status: "open",
      crossRefSlug: body.cross_ref_slug || null,
      crossRefLine: crossRefLine.value,
      parentId: body.parent_id || null,
      identifier: commentIdentity(request, user),
    },
  });

  // Notify the account owner (if any) that new feedback arrived. Best-effort and
  // debounced; suppressed when the owner is the one commenting. Reuse the `user`
  // already resolved above so we don't re-authenticate.
  const postedByOwner = await isDocOwner(request, doc, user);
  await notifyOwnerOfComment(doc, { postedByOwner });

  // Opt-in reply notifications (double opt-in). Subscribe the commenter to the
  // thread they're in: the parent comment if this is a reply, else their own
  // new comment.
  const notifyEmail =
    typeof body.notify_email === "string" ? body.notify_email : null;
  let notifyPending = false;
  if (notifyEmail) {
    const { pending } = await createReplySubscription({
      doc,
      targetCommentId: comment.parentId ?? comment.id,
      email: notifyEmail,
    });
    notifyPending = pending;
  }

  // If this is a reply, email confirmed subscribers of the parent comment
  // (excluding the person who just replied).
  if (comment.parentId) {
    await notifyReplySubscribers({
      reply: comment,
      doc,
      excludeEmail: notifyEmail,
    });
  }

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.body,
      author: comment.author,
      author_type: comment.authorType,
      anchor_type: comment.anchorType,
      anchor_ref: comment.anchorRef,
      anchor_text: comment.anchorText,
      doc_version: comment.docVersion,
      status: comment.status,
      cross_ref_slug: comment.crossRefSlug,
      cross_ref_line: comment.crossRefLine,
      parent_id: comment.parentId,
      notify_pending: notifyPending,
      created_at: comment.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
