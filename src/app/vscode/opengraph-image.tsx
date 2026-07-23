import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark for VS Code — review Markdown in your editor";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// vs code extension",
    title: ["Review Markdown", "without leaving your editor"],
    subtitle:
      "Reviewer comments as native VS Code comment threads. Human + agent. Works in Cursor, Windsurf, VSCodium.",
    pills: ["share", "inline comments", "anchor drift", "notifications"],
  });
}
