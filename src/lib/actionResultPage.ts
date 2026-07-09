// Minimal self-contained HTML page for email-link landing routes (confirm /
// unsubscribe). Inline-styled with the app's dark palette so it needs no client
// bundle. `status` controls the HTTP code (200 ok, 400 invalid link).

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function actionResultPage(opts: {
  heading: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  // When set, render a same-origin POST form with a single button instead of a
  // link. Used so the state-changing step (confirm / unsubscribe) requires a
  // deliberate click — a GET link-prefetch or email scanner only renders the
  // page and can't trigger the mutation.
  formAction?: string;
  formButtonLabel?: string;
  status?: number;
}): Response {
  const btnStyle =
    "display:inline-block;margin-top:24px;background:#c8b89a;color:#0d0d0d;padding:10px 20px;border-radius:6px;text-decoration:none;border:none;font:inherit;font-weight:500;cursor:pointer;";
  const action =
    opts.formAction && opts.formButtonLabel
      ? `<form method="post" action="${esc(opts.formAction)}"><button type="submit" style="${btnStyle}">${esc(
          opts.formButtonLabel
        )}</button></form>`
      : opts.linkUrl && opts.linkLabel
        ? `<a href="${esc(opts.linkUrl)}" style="${btnStyle}">${esc(opts.linkLabel)}</a>`
        : "";
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(opts.heading)} — Draftmark</title></head>
<body style="margin:0;background:#0d0d0d;color:#e8e6e1;font-family:sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:80px 24px;text-align:center;">
    <h1 style="font-size:22px;margin-bottom:12px;">${esc(opts.heading)}</h1>
    <p style="color:#8a8a8a;line-height:1.5;">${esc(opts.message)}</p>
    ${action}
  </div>
</body></html>`;
  return new Response(html, {
    status: opts.status ?? 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
