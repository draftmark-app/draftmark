import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCollectionWithMagicToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      docs: {
        orderBy: { position: "asc" },
        include: {
          doc: {
            select: {
              slug: true,
              title: true,
              visibility: true,
              viewsCount: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  comments: true,
                  reviews: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    slug: collection.slug,
    title: collection.title,
    created_at: collection.createdAt.toISOString(),
    updated_at: collection.updatedAt.toISOString(),
    docs: collection.docs.map((cd) => ({
      slug: cd.doc.slug,
      title: cd.doc.title,
      label: cd.label,
      position: cd.position,
      visibility: cd.doc.visibility,
      views_count: cd.doc.viewsCount,
      comments_count: cd.doc._count.comments,
      reviews_count: cd.doc._count.reviews,
      created_at: cd.doc.createdAt.toISOString(),
      updated_at: cd.doc.updatedAt.toISOString(),
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;
  const auth = await authorizeCollectionWithMagicToken(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Request body required" },
      { status: 400 }
    );
  }

  const { title, add_docs, remove_docs, reorder } = body;

  // Update title if provided
  if (title !== undefined) {
    await prisma.collection.update({
      where: { slug },
      data: { title },
    });
  }

  // Add docs: [{ slug: "abc123", label?: "Chapter 1" }]
  if (add_docs && Array.isArray(add_docs)) {
    // Get current max position
    const maxPos = await prisma.collectionDoc.findFirst({
      where: { collectionId: auth.collection!.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let nextPos = (maxPos?.position ?? -1) + 1;

    for (const entry of add_docs) {
      const doc = await prisma.doc.findUnique({
        where: { slug: entry.slug },
        select: { id: true },
      });
      if (!doc) continue;

      await prisma.collectionDoc.upsert({
        where: {
          collectionId_docId: {
            collectionId: auth.collection!.id,
            docId: doc.id,
          },
        },
        update: { label: entry.label ?? undefined },
        create: {
          collectionId: auth.collection!.id,
          docId: doc.id,
          position: nextPos++,
          label: entry.label ?? null,
        },
      });
    }
  }

  // Remove docs: ["slug1", "slug2"]
  if (remove_docs && Array.isArray(remove_docs)) {
    for (const docSlug of remove_docs) {
      const doc = await prisma.doc.findUnique({
        where: { slug: docSlug },
        select: { id: true },
      });
      if (!doc) continue;

      await prisma.collectionDoc.deleteMany({
        where: {
          collectionId: auth.collection!.id,
          docId: doc.id,
        },
      });
    }
  }

  // Reorder: [{ slug: "abc", position: 0 }, { slug: "def", position: 1 }]
  if (reorder && Array.isArray(reorder)) {
    for (const entry of reorder) {
      const doc = await prisma.doc.findUnique({
        where: { slug: entry.slug },
        select: { id: true },
      });
      if (!doc) continue;

      await prisma.collectionDoc.updateMany({
        where: {
          collectionId: auth.collection!.id,
          docId: doc.id,
        },
        data: { position: entry.position },
      });
    }
  }

  // Return updated collection
  const updated = await prisma.collection.findUnique({
    where: { slug },
    include: {
      docs: {
        orderBy: { position: "asc" },
        include: {
          doc: { select: { slug: true, title: true } },
        },
      },
    },
  });

  return NextResponse.json({
    slug: updated!.slug,
    title: updated!.title,
    docs: updated!.docs.map((cd) => ({
      slug: cd.doc.slug,
      title: cd.doc.title,
      label: cd.label,
      position: cd.position,
    })),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;
  const auth = await authorizeCollectionWithMagicToken(request, slug);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await prisma.collection.delete({ where: { slug } });

  return NextResponse.json({ deleted: true });
}
