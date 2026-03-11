import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendMagicLinkEmail(
  email: string,
  loginUrl: string
): Promise<void> {
  // In dev/test, log to console instead of sending email
  if (!resend) {
    console.log(`\n[Magic Link] ${email}\n${loginUrl}\n`);
    return;
  }

  await resend.emails.send({
    from: "Draftmark <login@draftmark.app>",
    to: email,
    subject: "Your login link for Draftmark",
    html: `
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
  });
}
