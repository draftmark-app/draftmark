import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://draftmark.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/doc/", "/docs", "/about", "/example"],
        disallow: ["/api/", "/new", "/created/", "/share/*/edit"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
