import { prisma } from "./prisma";
import { sendCommentNotificationEmail } from "./email";

// Coalesce a burst of comments (e.g. a reviewer leaving many inline comments in
// one sitting) into at most one owner email per window.
const NOTIFY_DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Best-effort: email the doc's account owner that new feedback arrived.
 *
 * - No-op when the doc has no account owner — magic-token-only docs have no
 *   email on file, so there's nobody to notify.
 * - Suppressed when the poster IS the owner: don't email people about their own
 *   comments.
 * - Debounced via docs.comment_notified_at. The debounce is claimed atomically
 *   with a conditional updateMany, so under concurrency exactly one request
 *   wins the window and sends — no double emails.
 *
 * Never throws: a notification failure must not fail the comment write. Callers
 * still await it (it returns fast when there's no owner) so the send completes
 * before the serverless response is flushed.
 */
export async function notifyOwnerOfComment(
  doc: { id: string; slug: string; title: string | null; userId: string | null },
  opts: { postedByOwner: boolean }
): Promise<void> {
  try {
    if (!doc.userId || opts.postedByOwner) return;

    // Resolve the recipient BEFORE claiming the window: a doc whose owner has no
    // email should never burn the debounce (there's nothing to send anyway).
    const owner = await prisma.user.findUnique({
      where: { id: doc.userId },
      select: { email: true },
    });
    if (!owner?.email) return;

    // Claim the window atomically — exactly one concurrent request wins and
    // sends; the rest see count 0 and bail. `stampedAt` lets us release the
    // claim precisely if the send fails, without clobbering a newer winner.
    const cutoff = new Date(Date.now() - NOTIFY_DEBOUNCE_MS);
    const stampedAt = new Date();
    const claimed = await prisma.doc.updateMany({
      where: {
        id: doc.id,
        OR: [{ commentNotifiedAt: null }, { commentNotifiedAt: { lt: cutoff } }],
      },
      data: { commentNotifiedAt: stampedAt },
    });
    if (claimed.count !== 1) return; // another request already holds this window

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    try {
      await sendCommentNotificationEmail(owner.email, {
        docTitle: doc.title,
        docUrl: `${baseUrl}/share/${doc.slug}`,
      });
    } catch (err) {
      // Send failed — release the window (only if still ours) so the next
      // comment can retry instead of being silently suppressed for 10 minutes.
      await prisma.doc.updateMany({
        where: { id: doc.id, commentNotifiedAt: stampedAt },
        data: { commentNotifiedAt: null },
      });
      throw err;
    }
  } catch {
    // best-effort — never surface notification failures to the writer
  }
}
