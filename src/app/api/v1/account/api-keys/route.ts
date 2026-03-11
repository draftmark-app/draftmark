import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateAccountApiKey, hashToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const keys = await prisma.accountApiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    api_keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      last_used_at: k.lastUsedAt?.toISOString() ?? null,
      created_at: k.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name || "default";

  const rawKey = generateAccountApiKey();
  await prisma.accountApiKey.create({
    data: {
      userId: user.id,
      name,
      key: hashToken(rawKey),
    },
  });

  return NextResponse.json(
    { api_key: rawKey, name },
    { status: 201 }
  );
}
