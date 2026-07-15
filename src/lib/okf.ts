import { extractTitleFromContent } from "@/lib/markdown";

// Open Knowledge Format (OKF) v0.1 — concept document synthesis.
// Spec: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
// A Draftmark Doc becomes an OKF concept document: synthesized YAML frontmatter
// (only `type` is required) followed by the raw markdown body. See
// docs/OKF_EXPORT_SPEC.md.

export const OKF_VERSION = "0.1";

/** The subset of a Doc needed to build an OKF concept document. */
export type OkfDocInput = {
  slug: string;
  title: string | null;
  content: string;
  meta: unknown; // Prisma Json — treated as an untrusted bag
  updatedAt: Date;
};

/**
 * Serialize a string as a double-quoted YAML scalar. Always quoting keeps the
 * output valid for arbitrary user content (titles are derived from the first
 * H1, so they may contain colons, quotes, `#`, etc.).
 */
function yamlString(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

function asMetaRecord(meta: unknown): Record<string, unknown> {
  return meta && typeof meta === "object" && !Array.isArray(meta)
    ? (meta as Record<string, unknown>)
    : {};
}

function metaString(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Collapse newlines and escape link-breaking chars for use as markdown link text. */
function inlineText(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/([[\]])/g, "\\$1");
}

/** Collapse a description to a single line for an index entry. */
function inlineDescription(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Build an OKF concept document for a doc. `type` falls back to "Document" when
 * `meta.type` is absent (§5 of the spec — meta.type passthrough, no migration).
 * `resource` points at the human share URL.
 */
export function buildOkfConceptDoc(doc: OkfDocInput, baseUrl: string): string {
  const meta = asMetaRecord(doc.meta);

  const type =
    typeof meta.type === "string" && meta.type.trim()
      ? meta.type.trim()
      : "Document";

  // Prefer stored title; fall back to first-heading extraction, then slug so
  // `title` is never empty.
  const title =
    doc.title ?? extractTitleFromContent(doc.content) ?? doc.slug;

  const description =
    typeof meta.description === "string" && meta.description.trim()
      ? meta.description.trim()
      : undefined;

  const tags = Array.isArray(meta.tags)
    ? meta.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];

  const resource = `${baseUrl}/share/${doc.slug}`;
  const timestamp = doc.updatedAt.toISOString();

  const front: string[] = ["---"];
  front.push(`type: ${yamlString(type)}`);
  front.push(`title: ${yamlString(title)}`);
  if (description) front.push(`description: ${yamlString(description)}`);
  front.push(`resource: ${yamlString(resource)}`);
  if (tags.length) front.push(`tags: [${tags.map(yamlString).join(", ")}]`);
  front.push(`timestamp: ${yamlString(timestamp)}`);
  front.push("---");

  return `${front.join("\n")}\n\n${doc.content}\n`;
}

/** A doc as it appears inside a collection bundle. */
export type OkfBundleDocInput = OkfDocInput & { label: string | null };

export type OkfManifest = {
  okf_version: string;
  bundle: string;
  files: { path: string; content: string }[];
};

/**
 * Assemble an OKF bundle manifest for a collection: a root `index.md`
 * (reserved file, no frontmatter) listing each concept, plus one
 * `concepts/{slug}.md` per doc. Callers are responsible for filtering `docs`
 * by access level before calling — this builder emits everything it is given.
 * `okf_version` is carried on the manifest rather than in `index.md`, keeping
 * the reserved file frontmatter-free.
 */
export function buildOkfBundle(
  bundle: { slug: string; title: string },
  docs: OkfBundleDocInput[],
  baseUrl: string
): OkfManifest {
  const files: { path: string; content: string }[] = [];

  const indexLines: string[] = [`# ${bundle.title}`, ""];
  for (const d of docs) {
    const meta = asMetaRecord(d.meta);
    const labelSource = d.label ?? d.title ?? d.slug;
    const description = metaString(meta, "description");
    const suffix = description ? ` - ${inlineDescription(description)}` : "";
    indexLines.push(`* [${inlineText(labelSource)}](/concepts/${d.slug}.md)${suffix}`);
  }
  files.push({ path: "index.md", content: `${indexLines.join("\n")}\n` });

  for (const d of docs) {
    files.push({
      path: `concepts/${d.slug}.md`,
      content: buildOkfConceptDoc(d, baseUrl),
    });
  }

  return { okf_version: OKF_VERSION, bundle: bundle.slug, files };
}
