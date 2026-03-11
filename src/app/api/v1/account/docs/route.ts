import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const docs = await prisma.doc.findMany({
    where: { userId: user.id },
    select: {
      slug: true,
      seoSlug: true,
      title: true,
      visibility: true,
      status: true,
      viewsCount: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { comments: true, reviews: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    docs: docs.map((d) => ({
      slug: d.slug,
      seo_slug: d.seoSlug,
      title: d.title,
      visibility: d.visibility,
      status: d.status,
      views_count: d.viewsCount,
      comments_count: d._count.comments,
      reviews_count: d._count.reviews,
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
    })),
  });
}
