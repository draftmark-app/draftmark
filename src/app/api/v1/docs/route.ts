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

  const {
    content,
    visibility = "public",
    title,
    version_note,
    expected_reviews,
    review_deadline,
    meta,
  } = body;

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

  // Validate optional review lifecycle fields
  if (expected_reviews !== undefined && (!Number.isInteger(expected_reviews) || expected_reviews < 1)) {
    return NextResponse.json(
      { error: "expected_reviews must be a positive integer" },
      { status: 400 }
    );
  }

  if (review_deadline !== undefined) {
    const deadline = new Date(review_deadline);
    if (isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: "review_deadline must be a valid ISO 8601 date" },
        { status: 400 }
      );
    }
  }

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: resolvedTitle,
      content,
      visibility,
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      expectedReviews: expected_reviews ?? null,
      reviewDeadline: review_deadline ? new Date(review_deadline) : null,
      meta: meta ?? undefined,
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
