import { prisma } from "./prisma";
import { generateSubscriptionToken, hashToken } from "./tokens";
import { sendReplyConfirmationEmail, sendReplyNotificationEmail } from "./email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Coalesce a burst of replies to one comment into at most one email per window
// per subscriber (e.g. an agent posting a batch of replies to the same thread).
const NOTIFY_DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes

// Recipient-wide anti-bomb throttle: cap outstanding (unconfirmed) confirmation
// emails per address across ALL docs within a rolling window, so a caller can't
// use many docs to flood one address with confirmation emails.
const MAX_PENDING_PER_EMAIL = 3;
const PENDING_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Unconfirmed subscriptions are opportunistically purged after this age — bounds
// PII retention for addresses that never confirmed and frees the pending slot.
const PENDING_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
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

    // Opportunistically purge stale unconfirmed subs (PII minimization; also
    // frees the pending (doc,email) slot after the TTL).
    await prisma.commentSubscription
      .deleteMany({
        where: { confirmedAt: null, createdAt: { lt: new Date(Date.now() - PENDING_TTL_MS) } },
      })
      .catch(() => {});

    // Recipient-wide throttle: bound outstanding confirmations per address across
    // all docs, so many docs can't be used to confirmation-bomb one address.
    const recentPending = await prisma.commentSubscription.count({
      where: {
        email,
        confirmedAt: null,
        createdAt: { gt: new Date(Date.now() - PENDING_WINDOW_MS) },
      },
    });
    if (recentPending >= MAX_PENDING_PER_EMAIL) return { pending: false };

    // Already confirmed for this exact comment — nothing to do.
    const existingConfirmed = await prisma.commentSubscription.findFirst({
      where: { email, commentId: opts.targetCommentId, confirmedAt: { not: null } },
      select: { id: true },
    });
    if (existingConfirmed) return { pending: false };

    const confirmRaw = generateSubscriptionToken();
    const unsubRaw = generateSubscriptionToken();
    let sub: { id: string };
    try {
      sub = await prisma.commentSubscription.create({
        data: {
          commentId: opts.targetCommentId,
          docId: opts.doc.id,
          email,
          confirmToken: hashToken(confirmRaw), // hashed — matched by hashing the incoming token
          unsubToken: unsubRaw, // unhashed — embedded in the notify email sent later
        },
        select: { id: true },
      });
    } catch (err) {
      // Partial unique index (doc_id, email) WHERE confirmed_at IS NULL: a
      // concurrent/duplicate request already has a pending sub for this pair.
      if (isUniqueViolation(err)) return { pending: true };
      throw err;
    }

    try {
      await sendReplyConfirmationEmail(email, {
        docTitle: opts.doc.title,
        confirmUrl: `${baseUrl()}/api/v1/comments/subscriptions/confirm?token=${confirmRaw}`,
      });
    } catch (err) {
      // Send failed — remove the pending row so the guard doesn't permanently
      // strand this (email, doc) opt-in; a later comment can retry cleanly.
      await prisma.commentSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      throw err;
    }
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
  doc: { slug: string; title: string | null; visibility: string };
  excludeEmail?: string | null;
}): Promise<void> {
  try {
    const parentId = opts.reply.parentId;
    if (!parentId) return;

    // Don't keep emailing activity on a doc that's no longer public — a subscriber
    // who confirmed while it was public shouldn't learn about a now-private doc.
    if (opts.doc.visibility !== "public") return;

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

    // Claim each subscription's debounce window atomically (fast DB writes), then
    // fan the actual sends out concurrently so the request path waits ~one send,
    // not N sequential sends, when a thread has many subscribers.
    const claimed = await Promise.all(
      subs.map(async (s) => {
        if (exclude && s.email === exclude) return null;
        const won = await prisma.commentSubscription.updateMany({
          where: {
            id: s.id,
            OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cutoff } }],
          },
          data: { lastNotifiedAt: new Date() },
        });
        return won.count === 1 ? s : null;
      })
    );

    const docUrl = `${baseUrl()}/share/${opts.doc.slug}`;
    await Promise.allSettled(
      claimed
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map((s) =>
          sendReplyNotificationEmail(s.email, {
            docTitle: opts.doc.title,
            docUrl,
            unsubUrl: `${baseUrl()}/api/v1/comments/subscriptions/unsubscribe?token=${s.unsubToken}`,
          }).catch(async () => {
            // Release the window so the next reply can retry.
            await prisma.commentSubscription
              .updateMany({ where: { id: s.id }, data: { lastNotifiedAt: null } })
              .catch(() => {});
          })
        )
    );
  } catch {
    // best-effort — never surface notification failures to the writer
  }
}
