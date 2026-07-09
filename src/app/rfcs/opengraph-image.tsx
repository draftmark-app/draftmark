import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark for RFCs & Proposals — write, get sign-off, move on";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// async review",
    title: ["Write the proposal.", "Get the sign-off."],
    subtitle: "Write the proposal. Get the sign-off. Move on.",
    pills: ["review deadlines", "Mermaid diagrams", "review tracking", "threads"],
  });
}
