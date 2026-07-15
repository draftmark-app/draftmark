import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCollectionWithMagicToken, getAuthenticatedUser } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";
import { buildOkfBundle, buildOkfTar } from "@/lib/okf";
import { gzipSync } from "node:zlib";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;

  // OKF bundle export — a manifest of markdown files (index.md + one concept
  // doc per member), or a gzipped tar of the same tree. Private member docs are
  // included only for a caller who proves collection ownership; anonymous
  // callers get public docs only, matching the privacy stance of the JSON
  // response below. See docs/OKF_EXPORT_SPEC.md §7. The `x-format` header is a
  // fallback for the `/c/:slug.okf` middleware rewrite, mirroring the doc route.
  const format =
    new URL(request.url).searchParams.get("format") || request.headers.get("x-format");
  if (format === "okf") {
    return exportOkfBundle(request, slug);
  }

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
    docs: collection.docs.map((cd) => {
      // This endpoint is unauthenticated. A private doc's title is auto-derived
      // from its first heading, so it is content — expose neither it nor the
      // owner-only view count to anonymous callers.
      const isPublic = cd.doc.visibility === "public";
      return {
        slug: cd.doc.slug,
        title: isPublic ? cd.doc.title : null,
        label: cd.label,
        position: cd.position,
        visibility: cd.doc.visibility,
        views_count: isPublic ? cd.doc.viewsCount : null,
        comments_count: cd.doc._count.comments,
        reviews_count: cd.doc._count.reviews,
        created_at: cd.doc.createdAt.toISOString(),
        updated_at: cd.doc.updatedAt.toISOString(),
      };
    }),
  });
}

async function exportOkfBundle(request: NextRequest, slug: string) {
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
              content: true,
              meta: true,
              updatedAt: true,
              visibility: true,
              // Version history feeds the bundle's reserved log.md changelog.
              // Metadata only — no content — so it leaks nothing extra.
              versions: {
                select: { versionNumber: true, versionNote: true, createdAt: true },
                orderBy: { versionNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Collection ownership — magic token, collection API key, or owning account.
  // A private doc can only be added to a collection by someone who proved that
  // doc's ownership (see PATCH add_docs), so an owner exporting private members
  // sees nothing they couldn't already read via the doc's own credential.
  const url = new URL(request.url);
  const magicToken = request.headers.get("x-magic-token") || url.searchParams.get("token");
  const isMagicOwner = !!magicToken && collection.magicToken === hashToken(magicToken);

  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isApiKeyOwner = !!(apiKey && !apiKey.startsWith("acct_") && collection.apiKey === hashToken(apiKey));

  const user = await getAuthenticatedUser(request);
  const isAccountOwner = !!(user && collection.userId && user.id === collection.userId);

  const isOwner = isMagicOwner || isApiKeyOwner || isAccountOwner;

  const members = collection.docs
    .map((cd) => ({ ...cd.doc, label: cd.label }))
    .filter((d) => isOwner || d.visibility === "public");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || url.origin;
  const manifest = buildOkfBundle(
    { slug: collection.slug, title: collection.title },
    members,
    baseUrl
  );

  // Content negotiation: a gzipped tarball when asked for via the `archive=tar`
  // param, an `Accept: application/gzip` header, or the `/c/:slug.okf`
  // middleware rewrite (`x-archive: tar`). JSON manifest otherwise.
  const accept = request.headers.get("accept") || "";
  const wantsTarball =
    url.searchParams.get("archive") === "tar" ||
    request.headers.get("x-archive") === "tar" ||
    accept.includes("application/gzip") ||
    accept.includes("application/x-tar");

  if (wantsTarball) {
    const tar = buildOkfTar(manifest, { mtime: collection.updatedAt });
    const gz = gzipSync(tar);
    return new NextResponse(new Uint8Array(gz), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${collection.slug}.okf.tar.gz"`,
      },
    });
  }

  return NextResponse.json(manifest);
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

    // Resolved once; used to let account owners add their own private docs
    // without having to supply each doc's magic token.
    const accountUserId = (await getAuthenticatedUser(request))?.id ?? null;

    for (const entry of add_docs) {
      const doc = await prisma.doc.findUnique({
        where: { slug: entry.slug },
        select: { id: true, visibility: true, magicToken: true, userId: true },
      });
      if (!doc) continue;

      // A private doc can only be added by someone who proves ownership —
      // either its magic token or an authenticated account that owns it.
      // Otherwise anyone could attach another user's private doc to a public
      // collection to expose its metadata.
      if (doc.visibility === "private") {
        const docToken =
          typeof entry.token === "string"
            ? entry.token
            : typeof entry.magic_token === "string"
              ? entry.magic_token
              : null;
        const hasTokenProof = !!docToken && doc.magicToken === hashToken(docToken);
        const hasAccountProof = !!doc.userId && accountUserId === doc.userId;
        if (!hasTokenProof && !hasAccountProof) continue;
      }

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
