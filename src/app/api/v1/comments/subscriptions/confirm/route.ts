import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { actionResultPage } from "@/lib/actionResultPage";

// Double opt-in confirmation. Reached from the confirmation email.
//
// GET only RENDERS a page (with a confirm button that POSTs) — it never mutates.
// This matters: email security scanners and link previewers routinely GET links,
// and a mutating GET would let them auto-confirm a third party, defeating the
// opt-in. The actual activation happens on POST, which requires a real click.
// The unguessable token in the URL is the secret, so no separate CSRF token is
// needed (an attacker without the token can't forge the POST).

function findByToken(token: string) {
  return prisma.commentSubscription.findUnique({
    where: { confirmToken: hashToken(token) },
  });
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This confirmation link is missing its token.",
      status: 400,
    });
  }

  const sub = await findByToken(token);
  if (!sub) {
    return actionResultPage({
      heading: "Link expired",
      message: "This confirmation link is invalid or has expired.",
      status: 400,
    });
  }

  if (sub.confirmedAt) {
    return actionResultPage({
      heading: "Already subscribed",
      message: "You're already set to receive replies to this comment.",
    });
  }

  return actionResultPage({
    heading: "Confirm reply notifications",
    message: "Click below to start receiving an email when someone replies to your comment.",
    formAction: `/api/v1/comments/subscriptions/confirm?token=${encodeURIComponent(token)}`,
    formButtonLabel: "Confirm notifications",
  });
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return actionResultPage({
      heading: "Invalid link",
      message: "This confirmation link is missing its token.",
      status: 400,
    });
  }

  const sub = await findByToken(token);
  if (!sub) {
    return actionResultPage({
      heading: "Link expired",
      message: "This confirmation link is invalid or has expired.",
      status: 400,
    });
  }

  // Idempotent: set confirmedAt only once. The token is retained so re-clicks
  // land on the "already subscribed" state rather than a confusing error.
  if (!sub.confirmedAt) {
    await prisma.commentSubscription.update({
      where: { id: sub.id },
      data: { confirmedAt: new Date() },
    });
  }

  return actionResultPage({
    heading: "You're subscribed",
    message: "We'll email you when someone replies to your comment. Every email has a one-click unsubscribe link.",
  });
}
