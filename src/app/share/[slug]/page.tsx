import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
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
    ? doc.content
        .replace(/^#.*\n/gm, "")
        .replace(/[*_`~\[\]]/g, "")
        .trim()
        .slice(0, 160)
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

  // Check access: magic token, share token, or account ownership.
  // The magic token normally arrives via the httpOnly cookie set by the
  // middleware token->cookie exchange (kept out of the URL); ?token= is still
  // honored for the first hop / API clients.
  const { hashToken, safeCompare } = await import("@/lib/tokens");
  const { cookies } = await import("next/headers");
  const cookieMagic = (await cookies()).get(`dm_tok_${slug}`)?.value;
  const hasValidToken =
    !!(token && doc.magicToken === hashToken(token)) ||
    !!(cookieMagic && doc.magicToken === hashToken(cookieMagic));
  // Share token can come via dedicated param or via token param (from prompt
  // form). Stored unhashed, so compare in constant time.
  const hasShareToken =
    !!(share_token && doc.shareToken && safeCompare(doc.shareToken, share_token)) ||
    !!(token && token.startsWith("share_") && doc.shareToken && safeCompare(doc.shareToken, token));

  const session = await getSession();
  const isAccountOwner = !!(session && doc.userId && session.userId === doc.userId);
  const isOwner = hasValidToken || isAccountOwner;
  const hasReadAccess = isOwner || hasShareToken;

  // Private doc without access — show token prompt
  if (doc.visibility === "private" && !hasReadAccess) {
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
          hasValidToken
            ? token
            : hasShareToken
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

