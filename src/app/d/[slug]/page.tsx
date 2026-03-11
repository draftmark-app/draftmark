import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    robots: {
      index: doc.visibility === "public",
      follow: true,
    },
    alternates: doc.visibility === "public" && doc.seoSlug
      ? { canonical: `/doc/${doc.seoSlug}` }
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

  // Private doc without token — show token prompt
  if (doc.visibility === "private") {
    const { hashToken } = await import("@/lib/tokens");
    if (!token || doc.magicToken !== hashToken(token)) {
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
  }

  return (
    <>
      <Nav />
      <DocView doc={{
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
      }} />
    </>
  );
}

function TokenPromptForm({ slug }: { slug: string }) {
  return (
    <form className="token-form" action={`/d/${slug}`} method="get">
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
