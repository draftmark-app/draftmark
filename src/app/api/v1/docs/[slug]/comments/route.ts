import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDocWithReadAccess, checkAcceptingFeedback } from "@/lib/auth";

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
      created_at: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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

  // Get current version number
  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: doc.id },
    orderBy: { versionNumber: "desc" },
  });

  const comment = await prisma.comment.create({
    data: {
      docId: doc.id,
      body: body.body,
      author: body.author || "anonymous",
      authorType: body.author_type === "agent" ? "agent" : "human",
      anchorType: body.anchor_type || null,
      anchorRef: body.anchor_ref ?? null,
      anchorText: body.anchor_text || null,
      docVersion: latestVersion?.versionNumber ?? 1,
      status: "open",
      crossRefSlug: body.cross_ref_slug || null,
      crossRefLine: body.cross_ref_line ?? null,
    },
  });

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
      created_at: comment.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
