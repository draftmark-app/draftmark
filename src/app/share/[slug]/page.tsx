import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Nav from "@/components/Nav";
import DocView from "@/components/DocView";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
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
  const { token } = await searchParams;

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

  // Check access: magic token or account ownership
  const { hashToken } = await import("@/lib/tokens");
  const hasValidToken = !!(token && doc.magicToken === hashToken(token));

  const session = await getSession();
  const isAccountOwner = !!(session && doc.userId && session.userId === doc.userId);
  const isOwner = hasValidToken || isAccountOwner;

  // Private doc without access — show token prompt
  if (doc.visibility === "private" && !isOwner) {
    return (
      <>
        <Nav />
        <div className="doc-view">
          <div className="token-prompt">
            <h1>This document is private</h1>
            <p>Paste your magic token to view this document.</p>
            <TokenPromptForm slug={slug} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <DocView
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
        placeholder="tok_..."
        className="token-input"
        autoFocus
      />
      <button type="submit" className="btn-primary">
        view document
      </button>
    </form>
  );
}
