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
  const doc = await prisma.doc.findUnique({ where: { slug } });

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

  return NextResponse.json({
    slug: doc.slug,
    title: doc.title,
    content: doc.content,
    visibility: doc.visibility,
    views_count: doc.viewsCount,
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

  const { content, title, visibility, version_note } = body;

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
