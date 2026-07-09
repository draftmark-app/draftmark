import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { actionResultPage } from "@/lib/actionResultPage";

// GET /api/v1/comments/subscriptions/unsubscribe?token=sub_...
// One-click unsubscribe from a reply-notification email. The unsub token is a
// random unguessable value stored unhashed, so it's looked up directly.
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This unsubscribe link is missing its token.",
      status: 400,
    });
  }

  // deleteMany so an already-used / unknown token is a no-op (still show success
  // — the desired end state, unsubscribed, holds either way).
  await prisma.commentSubscription.deleteMany({ where: { unsubToken: token } });

  return actionResultPage({
    heading: "Unsubscribed",
    message: "You won't receive any more emails about replies to that comment.",
  });
}
