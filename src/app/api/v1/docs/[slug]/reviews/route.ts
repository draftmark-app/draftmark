import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { checkAcceptingFeedback } from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string }> };

async function findDocWithAuth(slug: string, request: NextRequest) {
  const doc = await prisma.doc.findUnique({ where: { slug } });
  if (!doc) return { doc: null, authorized: false as const };

  if (doc.visibility === "public") {
    return { doc, authorized: true as const };
  }

  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (apiKey && doc.apiKey === hashToken(apiKey)) {
    return { doc, authorized: true as const };
  }

  return { doc, authorized: false as const };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const { doc, authorized } = await findDocWithAuth(slug, request);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "API key required for private documents" },
      { status: 401 }
    );
  }

  const reviews = await prisma.review.findMany({
    where: { docId: doc.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      reviewer_name: r.reviewerName,
      reviewer_type: r.reviewerType,
      identifier: r.identifier,
      created_at: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const { doc, authorized } = await findDocWithAuth(slug, request);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "API key required for private documents" },
      { status: 401 }
    );
  }

  // Check if doc is accepting feedback
  const feedbackCheck = checkAcceptingFeedback(doc);
  if (feedbackCheck) return feedbackCheck;

  const body = await request.json().catch(() => null);
  if (!body || !body.identifier) {
    return NextResponse.json(
      { error: "identifier is required" },
      { status: 400 }
    );
  }

  // Upsert: dedup by identifier per doc
  const review = await prisma.review.upsert({
    where: {
      docId_identifier: {
        docId: doc.id,
        identifier: body.identifier,
      },
    },
    update: {},
    create: {
      docId: doc.id,
      reviewerName: body.reviewer_name || "anonymous",
      reviewerType: body.reviewer_type === "agent" ? "agent" : "human",
      identifier: body.identifier,
    },
  });

  return NextResponse.json(
    {
      id: review.id,
      reviewer_name: review.reviewerName,
      reviewer_type: review.reviewerType,
      identifier: review.identifier,
      created_at: review.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
