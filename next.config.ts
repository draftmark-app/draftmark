import type { NextConfig } from "next";

// Applied to every response. CSP is production-only: the Next dev overlay and
// HMR need inline/eval scripts that a strict policy would block.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Notes on the allowances:
// - 'unsafe-inline' (scripts/styles) is required by the pre-hydration theme
//   script in layout.tsx, Next.js' bootstrap, and Mermaid/Redoc inline styles.
// - https://cdn.redoc.ly serves the Redoc bundle used by /api-docs.
// - Google Fonts hosts are referenced by Redoc's default stylesheet; the app's
//   own fonts are self-hosted via next/font.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.redoc.ly",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// User-generated surfaces are excluded from search while the spam backlog is
// cleaned up. Sent as a header (not just page metadata) so it applies to
// already-cached/raw responses and takes effect on the next crawl.
const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    const headers = [...SECURITY_HEADERS];
    if (process.env.NODE_ENV === "production") {
      headers.push(
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }
      );
    }
    return [
      { source: "/:path*", headers },
      { source: "/explore", headers: NOINDEX_HEADERS },
      { source: "/public/:path*", headers: NOINDEX_HEADERS },
      { source: "/share/:path*", headers: NOINDEX_HEADERS },
      { source: "/c/:path*", headers: NOINDEX_HEADERS },
    ];
  },
};

export default nextConfig;
