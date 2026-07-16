import { parse as parseYaml } from "yaml";
import { extractTitleFromContent } from "@/lib/markdown";

// Open Knowledge Format (OKF) v0.1 — bundle consumer.
// Parses an incoming bundle manifest (the inverse of the exporter in
// src/lib/okf.ts) into a structured plan the collection route materializes as a
// Collection of Docs. Pure and DB-free: no slug generation, no persistence.
// See docs/OKF_IMPORT_SPEC.md.

/** A file as it arrives in an import manifest. */
export type OkfImportFile = { path: string; content: string };

export type OkfImportManifest = {
  okf_version?: string;
  bundle?: string;
  files: OkfImportFile[];
};

/** One concept doc resolved from the bundle, ready to become a Draftmark Doc. */
export type OkfImportDoc = {
  /** Bundle-relative path, e.g. "concepts/orders.md" — used for link rewiring. */
  originalPath: string;
  title: string | null;
  content: string;
  meta: Record<string, unknown>;
  /** Nav label from index.md, if the doc is listed there. */
  label: string | null;
};

export type OkfImportResult = {
  collectionTitle: string;
  docs: OkfImportDoc[];
};

// index.md and log.md are reserved (directory listing + changelog); everything
// else ending in .md is a concept doc. Matched by basename so nested reserved
// files are also skipped. The okf.json sidecar isn't .md, so it drops out here.
const RESERVED = new Set(["index.md", "log.md"]);

function basename(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function isConceptFile(path: string): boolean {
  return path.toLowerCase().endsWith(".md") && !RESERVED.has(basename(path).toLowerCase());
}

/** Normalize a link/file path for matching: drop a leading `/` or `./`. */
function normalizePath(path: string): string {
  return path.replace(/^\.?\//, "");
}

/**
 * Split a concept doc into its parsed YAML frontmatter and markdown body.
 * Tolerant by design (OKF requires consumers to accept anything): a missing or
 * unparseable frontmatter block yields `{ frontmatter: null, body: <whole> }`
 * rather than throwing, and only a mapping (object) frontmatter is accepted.
 */
export function splitFrontmatter(content: string): {
  frontmatter: Record<string, unknown> | null;
  body: string;
} {
  const match = content.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!match) return { frontmatter: null, body: content };

  let parsed: unknown;
  try {
    parsed = parseYaml(match[1]);
  } catch {
    return { frontmatter: null, body: content }; // malformed YAML — treat as no frontmatter
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { frontmatter: null, body: content };
  }
  return {
    frontmatter: parsed as Record<string, unknown>,
    // Drop the single blank-line separator the exporter writes between the
    // closing `---` and the body (regex consumed only the first newline).
    body: content.slice(match[0].length).replace(/^\r?\n/, ""),
  };
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Build a Doc's meta bag from concept-doc frontmatter (the round-trip set plus
 * provenance). Unknown keys are tolerated but not preserved in v1. */
function metaFromFrontmatter(fm: Record<string, unknown> | null): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (!fm) return meta;

  const type = asString(fm.type);
  if (type) meta.type = type;
  const description = asString(fm.description);
  if (description) meta.description = description;
  if (Array.isArray(fm.tags)) {
    const tags = fm.tags.filter((t): t is string => typeof t === "string" && t.length > 0);
    if (tags.length) meta.tags = tags;
  }
  // Provenance — where the concept came from — kept namespaced so it can't
  // collide with the round-trip fields above.
  const resource = asString(fm.resource);
  if (resource) meta.okf_resource = resource;
  const timestamp = asString(fm.timestamp);
  if (timestamp) meta.okf_timestamp = timestamp;

  return meta;
}

/** Minimal unescape of the `\[` / `\]` that the exporter adds to index labels. */
function unescapeLabel(text: string): string {
  return text.replace(/\\([[\]])/g, "$1");
}

/** Parse a bundle's root index.md into a collection title, an ordered list of
 * referenced concept paths, and their labels. */
function parseIndex(indexContent: string): {
  title: string | null;
  entries: { path: string; label: string }[];
} {
  const titleMatch = indexContent.match(/^#[ \t]+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const entries: { path: string; label: string }[] = [];
  // List items: `* [label](target)` or `- [label](target)`, target optionally
  // in angle brackets. Only same-bundle targets (site-relative or bare) matter.
  const re = /^[ \t]*[*\-][ \t]+\[([^\]]*)\]\(\s*<?([^\s)>]+)>?[^)]*\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(indexContent)) !== null) {
    entries.push({ label: unescapeLabel(m[1]).trim(), path: normalizePath(m[2]) });
  }
  return { title, entries };
}

/**
 * Parse an OKF bundle manifest into an ordered set of concept docs plus a
 * collection title. Order and labels come from the root index.md when present;
 * concepts not listed there are appended in file order. Callers assign slugs,
 * rewrite intra-bundle links, and persist.
 */
export function parseOkfImport(
  manifest: OkfImportManifest,
  opts: { defaultTitle?: string } = {}
): OkfImportResult {
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const conceptFiles = files.filter((f) => isConceptFile(f.path));

  const byPath = new Map<string, OkfImportFile>();
  for (const f of conceptFiles) byPath.set(normalizePath(f.path), f);

  const indexFile = files.find((f) => basename(f.path).toLowerCase() === "index.md");
  const index = indexFile ? parseIndex(indexFile.content) : { title: null, entries: [] };

  const collectionTitle =
    index.title ||
    (manifest.bundle && manifest.bundle.trim()) ||
    opts.defaultTitle ||
    "Imported Collection";

  const ordered: { file: OkfImportFile; label: string | null }[] = [];
  const used = new Set<string>();

  // First, docs referenced by index.md, in listed order, carrying their labels.
  for (const entry of index.entries) {
    const file = byPath.get(entry.path);
    if (file && !used.has(entry.path)) {
      ordered.push({ file, label: entry.label || null });
      used.add(entry.path);
    }
  }
  // Then any concept not listed in the index, in file order.
  for (const f of conceptFiles) {
    const key = normalizePath(f.path);
    if (!used.has(key)) {
      ordered.push({ file: f, label: null });
      used.add(key);
    }
  }

  const docs: OkfImportDoc[] = ordered.map(({ file, label }) => {
    const { frontmatter, body } = splitFrontmatter(file.content);
    const title = asString(frontmatter?.title) ?? extractTitleFromContent(body) ?? null;
    return {
      originalPath: normalizePath(file.path),
      title,
      content: body,
      meta: metaFromFrontmatter(frontmatter),
      label,
    };
  });

  return { collectionTitle, docs };
}

// ── Intra-bundle link rewriting (inverse of export §8) ──────────────────────
// A bundle's concept docs link to siblings as `/concepts/{name}.md`. On import
// each concept becomes a Doc with a fresh Draftmark slug, so those links would
// dangle. Rewrite a link to `/share/{newSlug}` when its (bundle-relative) target
// is a concept we imported; leave everything else — external links, unknown
// paths, code — byte-for-byte. Conservative like the exporter: fenced code and
// query-string links are skipped. Kept independent of src/lib/okf.ts so the
// shipped exporter is untouched.

/** If `rawUrl` targets an imported concept, return `/share/{slug}` (preserving a
 * `#fragment`); otherwise null. */
function importedLinkTarget(rawUrl: string, pathToSlug: Map<string, string>): string | null {
  let url = rawUrl.trim();
  if (!url) return null;

  let hash = "";
  const hashIdx = url.indexOf("#");
  if (hashIdx !== -1) {
    hash = url.slice(hashIdx);
    url = url.slice(0, hashIdx);
  }
  if (url.includes("?")) return null; // query params carry meaning — don't touch
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) || url.startsWith("//")) return null; // absolute/other host

  const slug = pathToSlug.get(normalizePath(url));
  return slug ? `/share/${slug}${hash}` : null;
}

function rewriteLinksInText(text: string, pathToSlug: Map<string, string>): string {
  const swap = (raw: string): string => {
    const angled = raw.startsWith("<") && raw.endsWith(">");
    const bare = angled ? raw.slice(1, -1) : raw;
    const replacement = importedLinkTarget(bare, pathToSlug);
    if (!replacement) return raw;
    return angled ? `<${replacement}>` : replacement;
  };

  text = text.replace(
    /(\]\(\s*)(<[^>]*>|[^\s)]+)(\s*(?:"[^"]*"|'[^']*'|\([^)]*\))?\s*\))/g,
    (_w, open: string, target: string, close: string) => `${open}${swap(target)}${close}`
  );
  text = text.replace(
    /^([ \t]{0,3}\[[^\]]+\]:[ \t]*)(<[^>]*>|\S+)/gm,
    (_w, prefix: string, target: string) => `${prefix}${swap(target)}`
  );
  return text;
}

/**
 * Rewrite intra-bundle concept links in a doc body to Draftmark share links,
 * skipping fenced code blocks so example markdown survives verbatim.
 * `pathToSlug` maps a normalized concept path (e.g. `concepts/orders.md`) to the
 * newly assigned Draftmark slug.
 */
export function rewriteImportLinks(content: string, pathToSlug: Map<string, string>): string {
  if (pathToSlug.size === 0) return content;

  const lines = content.split("\n");
  const out: string[] = [];
  let buffer: string[] = [];
  let fenceChar: string | null = null;

  const flush = () => {
    if (buffer.length) {
      out.push(rewriteLinksInText(buffer.join("\n"), pathToSlug));
      buffer = [];
    }
  };

  for (const line of lines) {
    const open = line.match(/^[ \t]*(`{3,}|~{3,})/);
    if (fenceChar === null) {
      if (open) {
        flush();
        fenceChar = open[1][0];
        out.push(line);
      } else {
        buffer.push(line);
      }
    } else {
      out.push(line);
      const close = line.match(/^[ \t]*(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === fenceChar) fenceChar = null;
    }
  }
  flush();
  return out.join("\n");
}
