import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import CollectionView from "@/components/CollectionView";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) return { title: "Not found — Draftmark" };
  return {
    title: `${collection.title} — Draftmark`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      docs: {
        orderBy: { position: "asc" },
        include: {
          doc: {
            select: {
              slug: true,
              title: true,
              content: true,
              visibility: true,
              viewsCount: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  comments: true,
                  reviews: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!collection) notFound();

  const docs = collection.docs.map((cd) => ({
    slug: cd.doc.slug,
    title: cd.doc.title,
    label: cd.label,
    position: cd.position,
    visibility: cd.doc.visibility,
    viewsCount: cd.doc.viewsCount,
    commentsCount: cd.doc._count.comments,
    reviewsCount: cd.doc._count.reviews,
    contentPreview: cd.doc.content.slice(0, 200),
    createdAt: cd.doc.createdAt.toISOString(),
    updatedAt: cd.doc.updatedAt.toISOString(),
  }));

  return (
    <>
      <Nav />
      <CollectionView
        collection={{
          slug: collection.slug,
          title: collection.title,
          createdAt: collection.createdAt.toISOString(),
          updatedAt: collection.updatedAt.toISOString(),
        }}
        docs={docs}
      />
    </>
  );
}
