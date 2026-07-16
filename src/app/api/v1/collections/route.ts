import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import {
  generateMagicToken,
  generateApiKey,
  generateShareToken,
  hashToken,
} from "@/lib/tokens";
import { enforceRateLimit, LIMITS } from "@/lib/ratelimit";
import { getAuthenticatedUser, canAccessPrivateResources } from "@/lib/auth";
import { parseOkfImport, rewriteImportLinks } from "@/lib/okf-import";

// Cap a single import so one request can't create an unbounded number of docs.
const MAX_IMPORT_FILES = 100;

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, LIMITS.createCollection.bucket, LIMITS.createCollection.limit, LIMITS.createCollection.windowMs);
  if (limited) return limited;

  const format =
    new URL(request.url).searchParams.get("format") || request.headers.get("x-format");
  if (format === "okf") {
    return importOkfBundle(request);
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const { title } = body;
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const collection = await prisma.collection.create({
    data: {
      slug,
      title,
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
    },
  });

  return NextResponse.json(
    {
      slug: collection.slug,
      title: collection.title,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin}/c/${collection.slug}`,
      magic_token: rawMagicToken,
      api_key: rawApiKey,
    },
    { status: 201 }
  );
}

/**
 * Import an OKF bundle (JSON manifest) into a new Collection of Docs — the
 * consumer side of docs/OKF_IMPORT_SPEC.md. Purely additive: creates a
 * collection and one doc per concept, atomically. Intra-bundle concept links
 * are rewritten to the new docs' share URLs.
 */
async function importOkfBundle(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.files)) {
    return NextResponse.json(
      { error: "An OKF import requires a `files` array of { path, content }." },
      { status: 400 }
    );
  }
  if (body.files.length > MAX_IMPORT_FILES) {
    return NextResponse.json(
      { error: `Too many files — the import cap is ${MAX_IMPORT_FILES}.` },
      { status: 400 }
    );
  }

  const visibility = body.visibility ?? "public";
  if (visibility !== "public" && visibility !== "private") {
    return NextResponse.json(
      { error: "Visibility must be 'public' or 'private'" },
      { status: 400 }
    );
  }

  // Private import mirrors the private-doc gate on POST /docs.
  const user = await getAuthenticatedUser(request);
  if (visibility === "private" && !user) {
    return NextResponse.json(
      { error: "Authentication required to import private documents. Sign in or use an account API key (acct_...)." },
      { status: 401 }
    );
  }
  if (visibility === "private" && user && !canAccessPrivateResources(user)) {
    return NextResponse.json(
      { error: "Email verification required to import private documents." },
      { status: 403 }
    );
  }

  const plan = parseOkfImport(body, { defaultTitle: typeof body.title === "string" ? body.title : undefined });
  if (plan.docs.length === 0) {
    return NextResponse.json(
      { error: "No concept documents found in the bundle." },
      { status: 400 }
    );
  }

  // Assign slugs + credentials up front so intra-bundle links can be rewritten
  // to the final share URLs before anything is written.
  const prepared = plan.docs.map((d) => ({
    ...d,
    slug: generateSlug(),
    rawMagicToken: generateMagicToken(),
    rawApiKey: generateApiKey(),
    rawShareToken: visibility === "private" ? generateShareToken() : null,
  }));

  const pathToSlug = new Map(prepared.map((d) => [d.originalPath, d.slug]));
  for (const d of prepared) {
    d.content = rewriteImportLinks(d.content, pathToSlug);
  }

  const colSlug = generateSlug();
  const colMagicToken = generateMagicToken();
  const colApiKey = generateApiKey();

  // One transaction so a partial import can't leave orphan docs.
  await prisma.$transaction(async (tx) => {
    const collection = await tx.collection.create({
      data: {
        slug: colSlug,
        title: plan.collectionTitle,
        magicToken: hashToken(colMagicToken),
        apiKey: hashToken(colApiKey),
        userId: user?.id ?? null,
      },
    });

    for (let i = 0; i < prepared.length; i++) {
      const d = prepared[i];
      const doc = await tx.doc.create({
        data: {
          slug: d.slug,
          title: d.title,
          content: d.content,
          visibility,
          magicToken: hashToken(d.rawMagicToken),
          apiKey: hashToken(d.rawApiKey),
          shareToken: d.rawShareToken,
          meta: Object.keys(d.meta).length ? d.meta : undefined,
          userId: user?.id ?? null,
          versions: { create: { content: d.content, versionNumber: 1 } },
        },
      });
      await tx.collectionDoc.create({
        data: { collectionId: collection.id, docId: doc.id, position: i, label: d.label },
      });
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  return NextResponse.json(
    {
      collection: {
        slug: colSlug,
        title: plan.collectionTitle,
        url: `${baseUrl}/c/${colSlug}`,
        magic_token: colMagicToken,
        api_key: colApiKey,
      },
      docs: prepared.map((d) => ({
        slug: d.slug,
        title: d.title,
        label: d.label,
        url: `${baseUrl}/share/${d.slug}`,
        magic_token: d.rawMagicToken,
        api_key: d.rawApiKey,
        ...(d.rawShareToken && { share_token: d.rawShareToken }),
      })),
    },
    { status: 201 }
  );
}
