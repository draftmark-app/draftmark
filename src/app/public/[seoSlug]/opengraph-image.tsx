import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Draftmark document";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ seoSlug: string }>;
}) {
  const { seoSlug } = await params;
  const doc = await prisma.doc.findUnique({
    where: { seoSlug },
    select: { title: true, content: true },
  });

  const title = doc?.title || "Untitled";

  const preview = doc
    ? doc.content
        .replace(/^#{1,6}\s+.*$/gm, "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]+`/g, "")
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
        .replace(/[*_~>]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim()
        .slice(0, 200)
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#ffffff",
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
                color: "#888888",
                lineHeight: 1.5,
                overflow: "hidden",
              }}
            >
              {preview.length > 180 ? preview.slice(0, 177) + "..." : preview}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              fontWeight: 400,
              color: "#e0e0e0",
              letterSpacing: "-0.02em",
            }}
          >
            draft
          </span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            mark
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
