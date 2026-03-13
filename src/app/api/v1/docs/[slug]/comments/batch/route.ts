import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDocWithReadAccess, checkAcceptingFeedback } from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string }> };

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
  for (let i = 0; i < body.comments.length; i++) {
    const c = body.comments[i];
    if (!c.body || typeof c.body !== "string") {
      return NextResponse.json(
        { error: `Comment at index ${i}: body is required` },
        { status: 400 }
      );
    }
  }

  const latestVersion = await prisma.docVersion.findFirst({
    where: { docId: doc.id },
    orderBy: { versionNumber: "desc" },
  });

  try {
    const comments = [];
    for (const c of body.comments) {
      const comment = await prisma.comment.create({
        data: {
          docId: doc.id,
          body: c.body as string,
          author: (c.author as string) || "anonymous",
          authorType: c.author_type === "agent" ? "agent" : "human",
          anchorType: (c.anchor_type as string) || null,
          anchorRef: c.anchor_ref != null ? Number(c.anchor_ref) : null,
          anchorText: (c.anchor_text as string) || null,
          docVersion: latestVersion?.versionNumber ?? 1,
          status: "open",
          crossRefSlug: (c.cross_ref_slug as string) || null,
          crossRefLine: c.cross_ref_line != null ? Number(c.cross_ref_line) : null,
        },
      });
      comments.push(comment);
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
