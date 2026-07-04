import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Move an owner magic token (tok_) out of the URL into an httpOnly cookie,
  // then redirect to a clean URL. Keeps the edit-capable credential out of
  // browser history, bookmarks, referrers, and access logs. Runs BEFORE the
  // .md rewrite so the token never lingers on a raw-markdown URL either.
  // Slug is validated to safe chars before it becomes a cookie name. Share
  // tokens (share_) are intentionally shareable read links, left in the URL.
  const shareMatch = pathname.match(/^\/share\/([A-Za-z0-9_-]{1,64})(?:\.md|\/edit)?$/);
  if (shareMatch) {
    const token = request.nextUrl.searchParams.get("token");
    if (token && token.startsWith("tok_")) {
      const slug = shareMatch[1];
      const url = request.nextUrl.clone();
      url.searchParams.delete("token");
      const response = NextResponse.redirect(url);
      response.cookies.set({
        name: `dm_tok_${slug}`,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return response;
    }
  }

  // Rewrite /share/{slug}.md → API raw markdown endpoint
  const mdMatch = pathname.match(/^\/share\/([^/]+)\.md$/);
  if (mdMatch) {
    const slug = mdMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/api/v1/docs/${slug}`;
    const headers = new Headers(request.headers);
    headers.set("x-format", "raw");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (pathname.startsWith("/dashboard")) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/share/:path*", "/dashboard/:path*"],
};
