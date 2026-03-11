import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateSeoSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";
import { extractTitleFromContent } from "@/lib/markdown";
import { getAuthenticatedUser, canAccessPrivateResources } from "@/lib/auth";

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

  // Get authenticated user (via account API key or session cookie)
  const user = await getAuthenticatedUser(request);

  // Private docs require an authenticated account
  if (visibility === "private" && !user) {
    return NextResponse.json(
      { error: "Authentication required to create private documents. Sign in or use an account API key (acct_...)." },
      { status: 401 }
    );
  }

  // Unverified accounts lose private doc access after 24h
  if (visibility === "private" && user && !canAccessPrivateResources(user)) {
    return NextResponse.json(
      { error: "Email verification required. Verify your email to continue creating private documents." },
      { status: 403 }
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

  // Generate SEO-friendly slug from title for public docs
  const seoSlug = resolvedTitle && visibility === "public"
    ? await generateSeoSlug(resolvedTitle, slug)
    : null;

  const doc = await prisma.doc.create({
    data: {
      slug,
      seoSlug,
      title: resolvedTitle,
      content,
      visibility,
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      expectedReviews: expected_reviews ?? null,
      reviewDeadline: review_deadline ? new Date(review_deadline) : null,
      meta: meta ?? undefined,
      userId: user?.id ?? null,
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
      url: `${new URL(request.url).origin}/share/${doc.slug}`,
      magic_token: rawMagicToken,
      api_key: rawApiKey,
    },
    { status: 201 }
  );
}
