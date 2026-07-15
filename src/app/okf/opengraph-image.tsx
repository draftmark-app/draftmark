import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Draftmark is OKF compatible — markdown your agents can read";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "// open knowledge format",
    title: ["Markdown your", "agents can read"],
    subtitle:
      "Export docs and collections as OKF bundles — git-native, consumable by any agent.",
    pills: [".okf.md", "?format=okf", "concept docs", "no vendor lock-in"],
  });
}
