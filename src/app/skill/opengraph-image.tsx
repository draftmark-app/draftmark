import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark Skill — teach your agent to ship for review";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// claude code skill",
    title: ["Teach your agent", "to ship for review"],
    subtitle:
      "One skill. Your agent publishes plans, collects feedback, and iterates on its own.",
    pills: ["publish", "collect feedback", "iterate", "cross-session"],
  });
}
