import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const { title } = body;
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const collection = await prisma.collection.create({
    data: {
      slug,
      title,
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
    },
  });

  return NextResponse.json(
    {
      slug: collection.slug,
      title: collection.title,
      url: `${new URL(request.url).origin}/c/${collection.slug}`,
      magic_token: rawMagicToken,
      api_key: rawApiKey,
    },
    { status: 201 }
  );
}
