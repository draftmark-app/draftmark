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

  const title = doc.title || "Untitled";
  const description = doc.content
    .replace(/^#.*\n/gm, "")
    .replace(/[*_`~\[\]]/g, "")
    .trim()
    .slice(0, 160);

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

  // Check access: magic token, share token, or account ownership
  const { hashToken } = await import("@/lib/tokens");
  const hasValidToken = !!(token && doc.magicToken === hashToken(token));
  // Share token can come via dedicated param or via token param (from prompt form)
  const hasShareToken = !!(share_token && doc.shareToken === share_token) ||
    !!(token && token.startsWith("share_") && doc.shareToken === token);

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
  const shareUrl = isOwner && doc.visibility === "private" && doc.shareToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/share/${slug}?share_token=${encodeURIComponent(doc.shareToken)}`
    : null;

  return (
    <>
      <Nav />
      {shareUrl && <ShareBanner url={shareUrl} />}
      <DocView
        authToken={hasValidToken ? token : undefined}
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
          views: (() => {
            const meta = doc.meta as Record<string, unknown> | null;
            const v = meta?.views as Record<string, { content: string; model: string; generated_at: string }> | undefined;
            if (!v) return undefined;
            const result: Record<string, { content: string; model: string; generated_at: string }> = {};
            for (const [key, val] of Object.entries(v)) {
              if (val?.content) result[key] = val;
            }
            return Object.keys(result).length > 0 ? result : undefined;
          })(),
        }}
        isOwner={isOwner}
        editUrl={
          hasValidToken
            ? `/share/${slug}/edit?token=${encodeURIComponent(token!)}`
            : isAccountOwner
              ? `/share/${slug}/edit`
              : undefined
        }
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

