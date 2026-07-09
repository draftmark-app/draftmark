import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { actionResultPage } from "@/lib/actionResultPage";

// One-click unsubscribe from reply-notification emails.
//
// GET only RENDERS a confirm page — it never deletes. Mail clients and corporate
// link scanners fetch links, and a mutating GET would silently unsubscribe users
// before they read the email. The deletion happens on POST (a real click). The
// unsub token is a random unguessable value stored unhashed, so it's looked up
// directly and acts as the secret (no separate CSRF token needed).

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This unsubscribe link is missing its token.",
      status: 400,
    });
  }

  return actionResultPage({
    heading: "Unsubscribe?",
    message: "Click below to stop receiving emails about replies to this comment.",
    formAction: `/api/v1/comments/subscriptions/unsubscribe?token=${encodeURIComponent(token)}`,
    formButtonLabel: "Unsubscribe",
  });
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This unsubscribe link is missing its token.",
      status: 400,
    });
  }

  // deleteMany so an already-used / unknown token is a uniform no-op — the end
  // state (unsubscribed) holds either way, and there's no valid-vs-invalid oracle.
  await prisma.commentSubscription.deleteMany({ where: { unsubToken: token } });

  return actionResultPage({
    heading: "Unsubscribed",
    message: "You won't receive any more emails about replies to that comment.",
  });
}
