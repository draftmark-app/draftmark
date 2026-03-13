import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, generateAccountApiKey } from "@/lib/tokens";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  const hashed = hashToken(token);
  const loginToken = await prisma.loginToken.findUnique({
    where: { token: hashed },
    include: { user: true },
  });

  if (!loginToken) {
    return NextResponse.json(
      { error: "Invalid or expired login link" },
      { status: 401 }
    );
  }

  if (loginToken.usedAt) {
    return NextResponse.json(
      { error: "This login link has already been used" },
      { status: 401 }
    );
  }

  if (new Date() > loginToken.expiresAt) {
    return NextResponse.json(
      { error: "This login link has expired" },
      { status: 401 }
    );
  }

  // Mark token as used + verify email
  await prisma.loginToken.update({
    where: { id: loginToken.id },
    data: { usedAt: new Date() },
  });

  if (!loginToken.user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: loginToken.user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  // Auto-create default API key for new users
  const existingKeys = await prisma.accountApiKey.count({
    where: { userId: loginToken.user.id },
  });

  let welcomeKey: string | null = null;
  if (existingKeys === 0) {
    const rawKey = generateAccountApiKey();
    await prisma.accountApiKey.create({
      data: {
        userId: loginToken.user.id,
        name: "Default key",
        key: hashToken(rawKey),
      },
    });
    welcomeKey = rawKey;
  }

  // Create session JWT and set cookie
  const sessionToken = await createSessionToken(loginToken.user.id);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    new URL(request.url).origin;

  const redirectUrl = welcomeKey
    ? `${baseUrl}/dashboard?welcome=1`
    : `${baseUrl}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(sessionCookieOptions(sessionToken));

  // Store raw key in a short-lived cookie for the dashboard to read once
  if (welcomeKey) {
    response.cookies.set({
      name: "draftmark_welcome_key",
      value: welcomeKey,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 60 seconds — just long enough for the redirect
      path: "/",
    });
  }

  return response;
}
