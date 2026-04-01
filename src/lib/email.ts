const PLUNK_API_URL = "https://next-api.useplunk.com/v1/send";

export async function sendMagicLinkEmail(
  email: string,
  loginUrl: string
): Promise<void> {
  // In dev/test, log to console instead of sending email
  if (!process.env.PLUNK_API_KEY) {
    console.log(`\n[Magic Link] ${email}\n${loginUrl}\n`);
    return;
  }

  const res = await fetch(PLUNK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
    },
    body: JSON.stringify({
      to: email,
      from: "login@draftmark.app",
      subject: "Your login link for Draftmark",
      body: `
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
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Plunk email failed (${res.status}): ${error}`);
  }
}
