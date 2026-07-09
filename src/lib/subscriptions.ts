import { prisma } from "./prisma";
import { generateSubscriptionToken, hashToken } from "./tokens";
import { sendReplyConfirmationEmail, sendReplyNotificationEmail } from "./email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Coalesce a burst of replies to one comment into at most one email per window
// per subscriber (e.g. an agent posting a batch of replies to the same thread).
const NOTIFY_DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

/**
 * Double opt-in: record an unconfirmed subscription for `email` to replies on
 * `targetCommentId` and send a confirmation email. No notifications are sent
 * until the recipient clicks the confirm link — so a caller cannot sign a third
 * party up for reply spam.
 *
 * Returns `{ pending: true }` when a confirmation is outstanding (freshly sent
 * or already awaiting confirmation) so the UI can say "check your email".
 * Best-effort: never throws into the comment write.
 */
export async function createReplySubscription(opts: {
  doc: { id: string; slug: string; title: string | null };
  targetCommentId: string;
  email: string;
}): Promise<{ pending: boolean }> {
  try {
    const email = opts.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { pending: false };

    // Anti-bomb guard: at most one *unconfirmed* subscription per (email, doc).
    // Stops repeated comment posts from flooding an address with confirmation
    // emails; the per-IP comment rate limiter bounds everything else.
    const existingPending = await prisma.commentSubscription.findFirst({
      where: { email, confirmedAt: null, comment: { docId: opts.doc.id } },
      select: { id: true },
    });
    if (existingPending) return { pending: true };

    // Already confirmed for this exact comment — nothing to do.
    const existingConfirmed = await prisma.commentSubscription.findFirst({
      where: { email, commentId: opts.targetCommentId, confirmedAt: { not: null } },
      select: { id: true },
    });
    if (existingConfirmed) return { pending: false };

    const confirmRaw = generateSubscriptionToken();
    const unsubRaw = generateSubscriptionToken();
    await prisma.commentSubscription.create({
      data: {
        commentId: opts.targetCommentId,
        email,
        confirmToken: hashToken(confirmRaw), // hashed — matched by hashing the incoming token
        unsubToken: unsubRaw, // unhashed — embedded in the notify email sent later
      },
    });

    await sendReplyConfirmationEmail(email, {
      docTitle: opts.doc.title,
      confirmUrl: `${baseUrl()}/api/v1/comments/subscriptions/confirm?token=${confirmRaw}`,
    });
    return { pending: true };
  } catch {
    return { pending: false };
  }
}

/**
 * Email confirmed subscribers when a reply lands on the comment they follow.
 * Debounced per subscription; excludes the address that posted the reply (so
 * you're never emailed about your own reply). Best-effort — never throws.
 */
export async function notifyReplySubscribers(opts: {
  reply: { parentId: string | null };
  doc: { slug: string; title: string | null };
  excludeEmail?: string | null;
}): Promise<void> {
  try {
    const parentId = opts.reply.parentId;
    if (!parentId) return;

    const exclude = opts.excludeEmail?.trim().toLowerCase() || null;
    const cutoff = new Date(Date.now() - NOTIFY_DEBOUNCE_MS);

    const subs = await prisma.commentSubscription.findMany({
      where: {
        commentId: parentId,
        confirmedAt: { not: null },
        OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cutoff } }],
      },
      select: { id: true, email: true, unsubToken: true },
    });

    const docUrl = `${baseUrl()}/share/${opts.doc.slug}`;
    for (const s of subs) {
      if (exclude && s.email === exclude) continue;

      // Claim the per-subscription debounce atomically so concurrent replies
      // don't double-send to the same address.
      const claimed = await prisma.commentSubscription.updateMany({
        where: {
          id: s.id,
          OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cutoff } }],
        },
        data: { lastNotifiedAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      try {
        await sendReplyNotificationEmail(s.email, {
          docTitle: opts.doc.title,
          docUrl,
          unsubUrl: `${baseUrl()}/api/v1/comments/subscriptions/unsubscribe?token=${s.unsubToken}`,
        });
      } catch {
        // Release the window so the next reply can retry.
        await prisma.commentSubscription.updateMany({
          where: { id: s.id },
          data: { lastNotifiedAt: null },
        });
      }
    }
  } catch {
    // best-effort — never surface notification failures to the writer
  }
}
