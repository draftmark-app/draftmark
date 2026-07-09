import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark for AI Agents — your agent writes, humans review";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// agent workflow",
    title: ["Your agent writes.", "Humans review."],
    subtitle:
      "Your agent writes markdown, shares a link, and fetches structured feedback via API.",
    pills: ["POST /docs", "GET /comments", "agent badge", "batch"],
  });
}
