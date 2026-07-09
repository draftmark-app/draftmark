// SEO helpers shared by the public (/public/[seoSlug]) and share (/share/[slug])
// document routes.

// Google truncates SERP descriptions around ~160 chars, so the auto-generated
// fallback is sliced there. Editorially-authored descriptions (doc.meta
// .seoDescription) are honored in full up to a generous safety bound — a curated
// sentence is worth more than a hard 160-char cut, even if a SERP clips the tail.
const MAX_AUTO_DESCRIPTION = 160;
const MAX_CUSTOM_DESCRIPTION = 320;

/**
 * Clips to at most `max` characters. Slices by code points (not UTF-16 units)
 * so a multi-byte glyph straddling the boundary is never cut into a broken
 * surrogate, and trims a dangling trailing space left by a mid-word cut.
 */
function clip(text: string, max: number): string {
  const points = Array.from(text);
  if (points.length <= max) return text;
  return points.slice(0, max).join("").trimEnd();
}

/**
 * Reads a curated SEO description from a doc's `meta` JSONB, if present.
 * Stored under `meta.seoDescription` to avoid clashing with the arbitrary
 * user-supplied keys that also live in `meta`.
 */
function customDescription(meta: unknown): string | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const value = (meta as Record<string, unknown>).seoDescription;
    if (typeof value === "string" && value.trim().length > 0) {
      return clip(value.trim(), MAX_CUSTOM_DESCRIPTION);
    }
  }
  return null;
}

/**
 * Builds the meta description for a public doc. Prefers a curated
 * `meta.seoDescription`; otherwise derives one from the body by stripping
 * heading lines and inline markdown syntax, then clipping to ~160 chars.
 */
export function buildMetaDescription(doc: {
  content: string;
  meta?: unknown;
}): string {
  const custom = customDescription(doc.meta);
  if (custom) return custom;

  const body = doc.content
    // Strip ATX heading lines. Require whitespace after the #'s so "#hashtag"
    // is kept, and match the final line too (which may lack a trailing newline).
    .replace(/^#{1,6}\s+.*(?:\n|$)/gm, "")
    .replace(/[*_`~\[\]]/g, "")
    .trim();
  return clip(body, MAX_AUTO_DESCRIPTION);
}
