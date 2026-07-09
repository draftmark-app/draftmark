import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark for Writers — write, get honest feedback, publish";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// writing workflow",
    title: ["Write the draft.", "Get honest feedback."],
    subtitle: "Write the draft. Get honest feedback. Publish with confidence.",
    pills: ["inline comments", "reactions", "clean links", "no account"],
  });
}
