import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");

  const docs = await prisma.doc.findMany({
    where: { visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
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

  return NextResponse.json({
    docs: items.map((doc) => ({
      slug: doc.slug,
      seoSlug: doc.seoSlug,
      title: doc.title,
      content: doc.content,
      viewsCount: doc.viewsCount,
      createdAt: doc.createdAt,
      commentsCount: doc._count.comments,
      reviewsCount: doc._count.reviews,
    })),
    nextCursor,
  });
}
