import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLoginToken, hashToken } from "@/lib/tokens";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase().trim();

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // Create login token (15 min expiry)
  const rawToken = generateLoginToken();
  await prisma.loginToken.create({
    data: {
      userId: user.id,
      token: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Build magic link URL
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    new URL(request.url).origin;
  const loginUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(rawToken)}`;

  await sendMagicLinkEmail(email, loginUrl);

  return NextResponse.json({ ok: true });
}
