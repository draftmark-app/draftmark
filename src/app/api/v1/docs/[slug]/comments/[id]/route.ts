import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorizeWithApiKey,
  authorizeWithMagicToken,
  getAuthenticatedUser,
} from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string; id: string }> };

const COMMENT_STATUSES = ["open", "resolved", "dismissed"] as const;

/**
 * Authorize a comment mutation by any proof of doc ownership: the web owner's
 * magic token, the doc API key (used by the CLI), or an authenticated account
 * that owns the doc. Mirrors the doc PATCH handler so resolving a comment works
 * from the UI and the CLI alike.
 */
async function authorizeCommentOwner(request: NextRequest, slug: string) {
  const magic = await authorizeWithMagicToken(request, slug);
  if (magic.authorized) return { authorized: true as const, doc: magic.doc };

  const key = await authorizeWithApiKey(request, slug);
  if (key.authorized) return { authorized: true as const, doc: key.doc };

  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) {
    return { authorized: false as const, error: "Document not found", status: 404 };
  }
  const user = await getAuthenticatedUser(request);
  if (user && doc.userId && user.id === doc.userId) {
    return { authorized: true as const, doc };
  }

  // Distinguish "wrong credential" (403) from "no credential" (401): the magic
  // and api-key checks each return 403 when a credential was presented but
  // rejected, 401 when absent.
  const rejected = magic.status === 403 || key.status === 403;
  return rejected
    ? { authorized: false as const, error: "Not authorized to modify this comment", status: 403 }
    : { authorized: false as const, error: "Owner authentication required", status: 401 };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { slug, id } = await params;
  const auth = await authorizeCommentOwner(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.status) {
    return NextResponse.json(
      { error: "Status is required (open, resolved, or dismissed)" },
      { status: 400 }
    );
  }

  if (!COMMENT_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "Status must be 'open', 'resolved', or 'dismissed'" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.findFirst({
    where: { id, docId: auth.doc!.id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({
    id: updated.id,
    body: updated.body,
    author: updated.author,
    anchor_type: updated.anchorType,
    anchor_ref: updated.anchorRef,
    doc_version: updated.docVersion,
    status: updated.status,
    cross_ref_slug: updated.crossRefSlug,
    cross_ref_line: updated.crossRefLine,
    created_at: updated.createdAt.toISOString(),
  });
}

// Owner-only hard delete (same api-key auth as PATCH). Replies cascade via the
// Comment self-relation's onDelete: Cascade, so deleting a parent removes its
// thread too.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { slug, id } = await params;
  const auth = await authorizeCommentOwner(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const comment = await prisma.comment.findFirst({
    where: { id, docId: auth.doc!.id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
