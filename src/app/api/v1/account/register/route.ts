import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateLoginToken,
  generateAccountApiKey,
  hashToken,
} from "@/lib/tokens";
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Account already exists. Use your existing API key or sign in to create a new one." },
      { status: 409 }
    );
  }

  // Create user (unverified)
  const user = await prisma.user.create({ data: { email } });

  // Create account API key
  const rawKey = generateAccountApiKey();
  await prisma.accountApiKey.create({
    data: {
      userId: user.id,
      name: body.name || "Default key",
      key: hashToken(rawKey),
    },
  });

  // Send verification magic link
  const rawLoginToken = generateLoginToken();
  await prisma.loginToken.create({
    data: {
      userId: user.id,
      token: hashToken(rawLoginToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h to match grace period
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(rawLoginToken)}`;

  await sendMagicLinkEmail(email, verifyUrl);

  return NextResponse.json(
    {
      api_key: rawKey,
      email,
      verified: false,
      message:
        "Account created. A verification link was sent to your email. Verify within 24 hours to keep access to private documents.",
    },
    { status: 201 }
  );
}
