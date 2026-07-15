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

// ── Tarball packaging ───────────────────────────────────────────────────────
// A bundle is a directory tree, so the natural binary form is a tar archive
// (git/tar is OKF's preferred distribution channel). We hand-roll a minimal
// POSIX ustar writer rather than pull in a tar dependency — the same stance as
// the hand-rolled YAML above. Draftmark slugs are short (the deepest path,
// `{bundle}/concepts/{slug}.md`, stays well under the 100-byte ustar name
// limit), so long-name extensions are unnecessary.

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Build one 512-byte ustar header block for a regular file. */
function tarHeader(name: string, size: number, mtime: number): Uint8Array {
  const enc = new TextEncoder();
  const nameBytes = enc.encode(name);
  if (nameBytes.length > 100) {
    // Guarded rather than silently truncated: slugs keep us far from this, and
    // a truncated path would corrupt the archive.
    throw new Error(`OKF tar: path exceeds ustar 100-byte name limit (${name})`);
  }

  const header = new Uint8Array(512);
  const write = (offset: number, str: string) => header.set(enc.encode(str), offset);
  // Octal fields are null-terminated; `len` counts the terminator.
  const writeOctal = (offset: number, value: number, len: number) =>
    write(offset, value.toString(8).padStart(len - 1, "0") + "\0");

  header.set(nameBytes, 0); // name (0..100)
  write(100, "0000644\0"); // mode
  write(108, "0000000\0"); // uid
  write(116, "0000000\0"); // gid
  writeOctal(124, size, 12); // size
  writeOctal(136, mtime, 12); // mtime
  // Checksum field is treated as 8 spaces while summing.
  for (let i = 148; i < 156; i++) header[i] = 0x20;
  write(156, "0"); // typeflag: regular file
  write(257, "ustar\0"); // magic
  write(263, "00"); // version

  let sum = 0;
  for (let i = 0; i < 512; i++) sum += header[i];
  write(148, sum.toString(8).padStart(6, "0") + "\0 "); // 6 octal digits, NUL, space

  return header;
}

/**
 * Pack an OKF manifest into an uncompressed tar archive. Every entry is nested
 * under a `{bundle}/` root directory so extraction yields one self-contained
 * tree, and an `okf.json` sidecar carries `okf_version` — kept out of the
 * frontmatter-free `index.md` (see docs/OKF_EXPORT_SPEC.md §6.2). Callers gzip
 * the result. `mtime` (defaulting to the epoch for reproducibility) stamps
 * every file header.
 */
export function buildOkfTar(manifest: OkfManifest, opts: { mtime?: Date } = {}): Uint8Array {
  const mtime = Math.max(0, Math.floor((opts.mtime?.getTime() ?? 0) / 1000));
  const root = manifest.bundle;
  const sidecar =
    JSON.stringify({ okf_version: manifest.okf_version, bundle: manifest.bundle }, null, 2) + "\n";

  const entries = [{ path: "okf.json", content: sidecar }, ...manifest.files];
  const blocks: Uint8Array[] = [];
  const encoder = new TextEncoder();

  for (const entry of entries) {
    const body = encoder.encode(entry.content);
    blocks.push(tarHeader(`${root}/${entry.path}`, body.length, mtime));
    blocks.push(body);
    const remainder = body.length % 512;
    if (remainder !== 0) blocks.push(new Uint8Array(512 - remainder));
  }
  // Two zero blocks mark end-of-archive.
  blocks.push(new Uint8Array(512), new Uint8Array(512));

  return concatBytes(blocks);
}
