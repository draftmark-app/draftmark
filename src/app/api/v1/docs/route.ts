import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";
import { extractTitleFromContent } from "@/lib/markdown";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.content) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const { content, visibility = "public", title, version_note } = body;

  if (visibility !== "public" && visibility !== "private") {
    return NextResponse.json(
      { error: "Visibility must be 'public' or 'private'" },
      { status: 400 }
    );
  }

  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();
  const resolvedTitle = title || extractTitleFromContent(content) || null;

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: resolvedTitle,
      content,
      visibility,
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      versions: {
        create: {
          content,
          versionNote: version_note || null,
          versionNumber: 1,
        },
      },
    },
  });

  return NextResponse.json(
    {
      slug: doc.slug,
      url: `${new URL(request.url).origin}/d/${doc.slug}`,
      magic_token: rawMagicToken,
      api_key: rawApiKey,
    },
    { status: 201 }
  );
}
