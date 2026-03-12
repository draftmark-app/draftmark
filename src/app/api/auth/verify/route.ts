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

  // Auto-create a default API key if the user has none
  const keyCount = await prisma.accountApiKey.count({
    where: { userId: loginToken.user.id },
  });
  if (keyCount === 0) {
    const rawKey = generateAccountApiKey();
    await prisma.accountApiKey.create({
      data: {
        userId: loginToken.user.id,
        name: "default",
        key: hashToken(rawKey),
      },
    });
  }

  // Create session JWT and set cookie
  const sessionToken = await createSessionToken(loginToken.user.id);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    new URL(request.url).origin;

  const response = NextResponse.redirect(`${baseUrl}/dashboard`);
  response.cookies.set(sessionCookieOptions(sessionToken));
  return response;
}
