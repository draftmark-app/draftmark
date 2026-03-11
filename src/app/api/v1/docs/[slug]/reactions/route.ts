import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

type RouteContext = { params: Promise<{ slug: string }> };

const VALID_EMOJIS = ["thumbs_up", "check", "thinking", "cross"] as const;

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
