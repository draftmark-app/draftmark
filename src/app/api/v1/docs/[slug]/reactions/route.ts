import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDocWithReadAccess, checkAcceptingFeedback } from "@/lib/auth";

type RouteContext = { params: Promise<{ slug: string }> };

const VALID_EMOJIS = ["thumbs_up", "check", "thinking", "cross"] as const;

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const { doc, authorized } = await findDocWithReadAccess(slug, request);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "API key required for private documents" },
      { status: 401 }
    );
  }

  const reactions = await prisma.reaction.groupBy({
    by: ["emoji"],
    where: { docId: doc.id },
    _count: { emoji: true },
  });

  const counts: Record<string, number> = {};
  for (const emoji of VALID_EMOJIS) {
    counts[emoji] = 0;
  }
  for (const r of reactions) {
    counts[r.emoji] = r._count.emoji;
  }

  return NextResponse.json({ reactions: counts });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const { doc, authorized } = await findDocWithReadAccess(slug, request);

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
  if (!body || !body.emoji || !body.identifier) {
    return NextResponse.json(
      { error: "emoji and identifier are required" },
      { status: 400 }
    );
  }

  if (!VALID_EMOJIS.includes(body.emoji)) {
    return NextResponse.json(
      { error: `Invalid emoji. Must be one of: ${VALID_EMOJIS.join(", ")}` },
      { status: 400 }
    );
  }

  // Upsert: if already exists, return existing (dedup)
  const reaction = await prisma.reaction.upsert({
    where: {
      docId_emoji_identifier: {
        docId: doc.id,
        emoji: body.emoji,
        identifier: body.identifier,
      },
    },
    update: {},
    create: {
      docId: doc.id,
      emoji: body.emoji,
      identifier: body.identifier,
    },
  });

  return NextResponse.json(
    {
      id: reaction.id,
      emoji: reaction.emoji,
      identifier: reaction.identifier,
      created_at: reaction.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
