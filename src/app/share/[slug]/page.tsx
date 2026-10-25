import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { evaluateDocAccess } from "@/lib/auth";
import { buildMetaDescription } from "@/lib/seo";
import Nav from "@/components/Nav";
import DocView from "@/components/DocView";
import ShareBanner from "@/components/ShareBanner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; share_token?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) return { title: "Not found — Draftmark" };

  // Never expose private content (title is derived from the first heading, and
  // the description from the body) in metadata served before the token gate.
  const isPublic = doc.visibility === "public";
  const title = isPublic ? doc.title || "Untitled" : "Private document";
  const description = isPublic
    ? buildMetaDescription(doc)
    : "A private document on Draftmark.";

  return {
    title: `${title} — Draftmark`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/share/${slug}`,
      siteName: "Draftmark",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: doc.visibility === "public",
      follow: true,
    },
    alternates: doc.visibility === "public" && doc.seoSlug
      ? { canonical: `/public/${doc.seoSlug}` }
      : undefined,
  };
}

export default async function DocPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token, share_token } = await searchParams;

  const doc = await prisma.doc.findUnique({
    where: { slug },
    include: {
      _count: { select: { comments: true, reviews: true } },
      versions: {
        orderBy: { versionNumber: "desc" as const },
        take: 1,
        select: { versionNumber: true },
      },
    },
  });
  if (!doc) notFound();

  const currentVersion = doc.versions[0]?.versionNumber ?? 1;

  // Increment view count (fire and forget)
  prisma.doc.update({
    where: { slug },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Access is resolved by the same evaluator the API uses. The magic token
  // normally arrives via the httpOnly cookie set by the middleware token->cookie
  // exchange (kept out of the URL); ?token= is still honored for the first hop.
  const cookieStore = await cookies();
  const headerStore = await headers();
  const headerMagic = headerStore.get("x-magic-token");
  const tokenParam = token ?? null;
  const magicTokens = [
    headerMagic,
    tokenParam,
    cookieStore.get(`dm_tok_${slug}`)?.value ?? null,
  ].filter((t): t is string => !!t);
  const shareTokens = [
    share_token ?? null,
    headerStore.get("x-share-token"),
    ...[tokenParam, headerMagic].filter((t): t is string => !!t && t.startsWith("share_")),
  ].filter((t): t is string => !!t);
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const session = await getSession();
  const access = evaluateDocAccess(doc, {
    magicTokens,
    shareTokens,
    apiKey: bearerToken && !bearerToken.startsWith("acct_") ? bearerToken : null,
    userId: session?.userId ?? null,
  });
  const isOwner = access.owner;

  // Private doc without access — show token prompt
  if (!access.readable) {
    return (
      <>
        <Nav />
        <div className="doc-view">
          <div className="token-prompt">
            <h1>This document is private</h1>
            <p>Paste your access token to view this document.</p>
            <TokenPromptForm slug={slug} />
          </div>
        </div>
      </>
    );
  }

  // Build share URL for owner banner
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const shareUrl = isOwner && doc.visibility === "private" && doc.shareToken
    ? `${baseUrl}/share/${slug}?share_token=${encodeURIComponent(doc.shareToken)}`
    : null;

  // Build raw .md URL for current viewer. Prefer share_token for private docs
  // (read-only, what you'd hand an agent) over the owner's magic_token.
  const rawUrl = (() => {
    if (doc.visibility === "public") return `${baseUrl}/share/${slug}.md`;
    if (doc.shareToken) return `${baseUrl}/share/${slug}.md?token=${encodeURIComponent(doc.shareToken)}`;
    // Owner without a share token: a clean .md URL works because the magic-token
    // cookie (Path=/) is sent to the .md route too.
    if (isOwner) return `${baseUrl}/share/${slug}.md`;
    return null;
  })();

  return (
    <>
      <Nav />
      {shareUrl && <ShareBanner url={shareUrl} rawUrl={rawUrl} />}
      <DocView
        authToken={
          access.ownerByMagic
            ? token
            : access.byShareToken
              ? doc.shareToken ?? undefined
              : undefined
        }
        rawUrl={rawUrl}
        doc={{
          slug: doc.slug,
          title: doc.title,
          content: doc.content,
          visibility: doc.visibility,
          status: doc.status,
          expectedReviews: doc.expectedReviews,
          reviewDeadline: doc.reviewDeadline?.toISOString() ?? null,
          viewsCount: doc.viewsCount,
          commentsCount: doc._count.comments,
          reviewsCount: doc._count.reviews,
          currentVersion,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        }}
        isOwner={isOwner}
        editUrl={isOwner ? `/share/${slug}/edit` : undefined}
      />
    </>
  );
}

function TokenPromptForm({ slug }: { slug: string }) {
  return (
    <form className="token-form" action={`/share/${slug}`} method="get">
      <input
        type="text"
        name="token"
        placeholder="tok_... or share_..."
        className="token-input"
        autoFocus
      />
      <button type="submit" className="btn-primary">
        view document
      </button>
    </form>
  );
}

