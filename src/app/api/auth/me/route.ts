import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, canAccessPrivateResources } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      email_verified: !!user.emailVerifiedAt,
      can_access_private: canAccessPrivateResources(user),
    },
  });
}
