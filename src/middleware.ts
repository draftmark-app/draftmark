import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function middleware(request: NextRequest) {
  // Rewrite /share/{slug}.md → API raw markdown endpoint
  const mdMatch = request.nextUrl.pathname.match(/^\/share\/([^/]+)\.md$/);
  if (mdMatch) {
    const slug = mdMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/api/v1/docs/${slug}`;
    const headers = new Headers(request.headers);
    headers.set("x-format", "raw");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
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
