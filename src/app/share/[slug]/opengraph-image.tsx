import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Draftmark document";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await prisma.doc.findUnique({
    where: { slug },
    select: { title: true, content: true, visibility: true },
  });

  const title = doc?.title || "Untitled";
  const isPrivate = doc?.visibility === "private";

  // Extract a content preview: strip markdown syntax, take first ~200 chars
  const preview = doc
    ? doc.content
        .replace(/^#{1,6}\s+.*$/gm, "") // headings
        .replace(/```[\s\S]*?```/g, "") // code blocks
        .replace(/`[^`]+`/g, "") // inline code
        .replace(/!\[.*?\]\(.*?\)/g, "") // images
        .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links → text
        .replace(/[*_~>]/g, "") // emphasis, blockquotes
        .replace(/\n{2,}/g, "\n") // collapse blank lines
        .trim()
        .slice(0, 200)
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d0d0d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#c8b89a",
          }}
        />

        {/* Doc content */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#e8e6e1",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
              overflow: "hidden",
            }}
          >
            {title.length > 60 ? title.slice(0, 57) + "..." : title}
          </div>
          {preview && (
            <div
              style={{
                fontSize: "26px",
                color: "#8a8a8a",
                lineHeight: 1.5,
                overflow: "hidden",
              }}
            >
              {preview.length > 180
                ? preview.slice(0, 177) + "..."
                : preview}
            </div>
          )}
        </div>

        {/* Bottom: branding + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#c8b89a",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                color: "#0d0d0d",
                fontWeight: 700,
              }}
            >
              D
            </div>
            <span
              style={{
                fontSize: "28px",
                color: "#8a8a8a",
                letterSpacing: "-0.02em",
              }}
            >
              draftmark.app
            </span>
          </div>
          {isPrivate && (
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                color: "#8a8a8a",
                border: "1px solid #242424",
                borderRadius: "8px",
                padding: "6px 16px",
              }}
            >
              private document
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
