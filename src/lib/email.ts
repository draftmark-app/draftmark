const PLUNK_API_URL = "https://next-api.useplunk.com/v1/send";
const SEND_TIMEOUT_MS = 5000;

async function sendEmail(
  to: string,
  from: string,
  subject: string,
  body: string,
  dev: { label: string; detail: string }
): Promise<void> {
  // In dev/test, log to console instead of sending email. `detail` carries the
  // actionable value (e.g. the magic-login URL) so local flows stay usable.
  if (!process.env.PLUNK_API_KEY) {
    console.log(`\n[${dev.label}] ${to}\n${dev.detail}\n`);
    return;
  }

  // Bound the send so a hung provider can't stall the request path that awaits
  // it (comment POST awaits the notification before the response is flushed).
  const res = await fetch(PLUNK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
    },
    body: JSON.stringify({ to, from, subject, body }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Plunk email failed (${res.status}): ${error}`);
  }
}

export async function sendMagicLinkEmail(
  email: string,
  loginUrl: string
): Promise<void> {
  await sendEmail(
    email,
    "login@draftmark.app",
    "Your login link for Draftmark",
    `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin-bottom: 24px;">Sign in to Draftmark</h2>
          <p style="color: #666; margin-bottom: 24px;">
            Click the button below to sign in. This link expires in 15 minutes.
          </p>
          <a href="${loginUrl}"
             style="display: inline-block; background: #c8b89a; color: #0d0d0d; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Sign in to Draftmark
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
        </div>
      `,
    { label: "Magic Link", detail: loginUrl }
  );
}

export async function sendCommentNotificationEmail(
  email: string,
  opts: { docTitle: string | null; docUrl: string }
): Promise<void> {
  const title = opts.docTitle?.trim() || "your document";
  await sendEmail(
    email,
    "notifications@draftmark.app",
    `New feedback on "${title}"`,
    `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin-bottom: 24px;">New feedback on Draftmark</h2>
          <p style="color: #666; margin-bottom: 24px;">
            Someone left new feedback on <strong>${escapeHtml(title)}</strong>.
          </p>
          <a href="${escapeHtml(opts.docUrl)}"
             style="display: inline-block; background: #c8b89a; color: #0d0d0d; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View the document
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            You're receiving this because you own this document on Draftmark.
          </p>
        </div>
      `,
    { label: "Comment Notification", detail: opts.docUrl }
  );
}

export async function sendReplyConfirmationEmail(
  email: string,
  opts: { docTitle: string | null; confirmUrl: string }
): Promise<void> {
  const title = opts.docTitle?.trim() || "a document";
  await sendEmail(
    email,
    "notifications@draftmark.app",
    "Confirm reply notifications on Draftmark",
    `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin-bottom: 24px;">Confirm reply notifications</h2>
          <p style="color: #666; margin-bottom: 24px;">
            You asked to be emailed when someone replies to your comment on
            <strong>${escapeHtml(title)}</strong>. Confirm to start receiving them.
          </p>
          <a href="${escapeHtml(opts.confirmUrl)}"
             style="display: inline-block; background: #c8b89a; color: #0d0d0d; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Confirm notifications
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email — no notifications will be sent.
          </p>
        </div>
      `,
    { label: "Reply Confirmation", detail: opts.confirmUrl }
  );
}

export async function sendReplyNotificationEmail(
  email: string,
  opts: { docTitle: string | null; docUrl: string; unsubUrl: string }
): Promise<void> {
  const title = opts.docTitle?.trim() || "a document";
  await sendEmail(
    email,
    "notifications@draftmark.app",
    `New reply on "${title}"`,
    `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin-bottom: 24px;">New reply on Draftmark</h2>
          <p style="color: #666; margin-bottom: 24px;">
            Someone replied to your comment on <strong>${escapeHtml(title)}</strong>.
          </p>
          <a href="${escapeHtml(opts.docUrl)}"
             style="display: inline-block; background: #c8b89a; color: #0d0d0d; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View the reply
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            <a href="${escapeHtml(opts.unsubUrl)}" style="color: #999;">Unsubscribe from replies to this comment</a>
          </p>
        </div>
      `,
    { label: "Reply Notification", detail: opts.docUrl }
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
