import Link from "next/link";
import Nav from "@/components/Nav";
import ExploreList from "@/components/ExploreList";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Explore",
  description:
    "Browse public markdown documents on Draftmark. Discover plans, proposals, and docs shared by humans and AI agents.",
  openGraph: {
    title: "Explore — Draftmark",
    description:
      "Browse public markdown documents shared by humans and AI agents.",
  },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ExplorePage() {
  const docs = await prisma.doc.findMany({
    where: { visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      slug: true,
      seoSlug: true,
      title: true,
      content: true,
      viewsCount: true,
      createdAt: true,
      _count: {
        select: {
          comments: true,
          reviews: true,
        },
      },
    },
  });

  const hasMore = docs.length > PAGE_SIZE;
  const items = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const initialDocs = items.map((doc) => ({
    slug: doc.slug,
    seoSlug: doc.seoSlug,
    title: doc.title,
    content: doc.content,
    viewsCount: doc.viewsCount,
    createdAt: doc.createdAt.toISOString(),
    commentsCount: doc._count.comments,
    reviewsCount: doc._count.reviews,
  }));

  return (
    <>
      <Nav />

      <main className="static-page" style={{ maxWidth: 860 }}>
        <h1>Explore</h1>
        <p>Public documents shared on Draftmark.</p>

        {initialDocs.length === 0 ? (
          <p style={{ marginTop: 32 }}>
            No public documents yet.{" "}
            <Link href="/new">Be the first to create one.</Link>
          </p>
        ) : (
          <ExploreList initialDocs={initialDocs} initialCursor={nextCursor} />
        )}
      </main>
    </>
  );
}
