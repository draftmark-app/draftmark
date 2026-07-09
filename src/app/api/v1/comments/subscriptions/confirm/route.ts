import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { actionResultPage } from "@/lib/actionResultPage";

// GET /api/v1/comments/subscriptions/confirm?token=sub_...
// Clicked from the double opt-in confirmation email. Activates the subscription.
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This confirmation link is missing its token.",
      status: 400,
    });
  }

  const sub = await prisma.commentSubscription.findUnique({
    where: { confirmToken: hashToken(token) },
    include: { comment: { include: { doc: { select: { slug: true, title: true } } } } },
  });

  if (!sub) {
    return actionResultPage({
      heading: "Link expired",
      message: "This confirmation link is invalid or has already been used.",
      status: 400,
    });
  }

  // Confirm and consume the token (one-time). Idempotent if clicked twice within
  // the same request race — confirmedAt is only set once.
  await prisma.commentSubscription.update({
    where: { id: sub.id },
    data: { confirmedAt: sub.confirmedAt ?? new Date(), confirmToken: null },
  });

  const slug = sub.comment.doc.slug;
  return actionResultPage({
    heading: "You're subscribed",
    message: "We'll email you when someone replies to your comment. You can unsubscribe anytime from those emails.",
    linkUrl: `${baseUrl}/share/${slug}`,
    linkLabel: "View the document",
  });
}
