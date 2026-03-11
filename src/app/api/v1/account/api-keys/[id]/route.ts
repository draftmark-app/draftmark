import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const key = await prisma.accountApiKey.findUnique({ where: { id } });

  if (!key || key.userId !== user.id) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await prisma.accountApiKey.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
