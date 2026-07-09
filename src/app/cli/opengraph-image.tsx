import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark CLI — share markdown from your terminal";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// cli",
    title: ["Share markdown", "from your terminal"],
    subtitle:
      "npm install -g draftmark. Create, review, and close — from the shell.",
    pills: ["dm create", "dm comments --json", "dm close", "exit codes"],
  });
}
