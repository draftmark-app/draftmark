import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark for Prompt Sharing — share, review, ship better";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// prompt workflow",
    title: ["Share your prompts.", "Review them together."],
    subtitle: "Share your prompts. Review them together. Ship better.",
    pills: ["inline comments", "version tracking", "reactions", "share links"],
  });
}
