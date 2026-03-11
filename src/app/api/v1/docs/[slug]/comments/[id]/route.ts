import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithApiKey } from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { slug, id } = await params;
  const auth = await authorizeWithApiKey(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.status) {
    return NextResponse.json(
      { error: "Status is required (resolved or dismissed)" },
      { status: 400 }
    );
  }

  if (body.status !== "resolved" && body.status !== "dismissed") {
    return NextResponse.json(
      { error: "Status must be 'resolved' or 'dismissed'" },
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
