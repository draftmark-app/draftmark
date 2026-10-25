// Request payload caps. These bound storage and rendering cost per doc; markdown
// docs are plain text, so 1 MB is generous for the intended use case while
// keeping a single request from exhausting memory or disk.
export const MAX_CONTENT_BYTES = 1_000_000; // 1 MB
export const MAX_TITLE_CHARS = 500;
export const MAX_VERSION_NOTE_CHARS = 500;
export const MAX_META_BYTES = 16_384; // 16 KB

function tooLarge(value: string, maxBytes: number): boolean {
  return Buffer.byteLength(value, "utf8") > maxBytes;
}

export function validateContent(content: unknown): string | null {
  if (typeof content !== "string" || content.length === 0) {
    return "Content is required and must be a non-empty string";
  }
  if (tooLarge(content, MAX_CONTENT_BYTES)) {
    return `Content exceeds the ${MAX_CONTENT_BYTES}-byte limit`;
  }
  return null;
}

export function validateTitle(title: unknown): string | null {
  if (title === undefined || title === null) return null;
  if (typeof title !== "string") return "Title must be a string or null";
  if (title.length > MAX_TITLE_CHARS) {
    return `Title exceeds the ${MAX_TITLE_CHARS}-character limit`;
  }
  return null;
}

export function validateVersionNote(note: unknown): string | null {
  if (note === undefined || note === null) return null;
  if (typeof note !== "string") return "version_note must be a string or null";
  if (note.length > MAX_VERSION_NOTE_CHARS) {
    return `version_note exceeds the ${MAX_VERSION_NOTE_CHARS}-character limit`;
  }
  return null;
}

export function validateMeta(meta: unknown): string | null {
  if (meta === undefined || meta === null) return null;
  if (typeof meta !== "object" || Array.isArray(meta)) {
    return "meta must be a JSON object";
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(meta);
  } catch {
    return "meta must be JSON-serializable";
  }
  if (tooLarge(serialized, MAX_META_BYTES)) {
    return `meta exceeds the ${MAX_META_BYTES}-byte limit`;
  }
  return null;
}

export const MAX_COMMENT_CHARS = 20_000;
export const MAX_AUTHOR_CHARS = 100;
export const MAX_ANCHOR_TEXT_CHARS = 2_000;

export function validateCommentBody(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Comment body is required";
  }
  if (value.length > MAX_COMMENT_CHARS) {
    return `Comment body exceeds the ${MAX_COMMENT_CHARS}-character limit`;
  }
  return null;
}

export function validateAuthor(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "author must be a string";
  if (value.length > MAX_AUTHOR_CHARS) {
    return `author exceeds the ${MAX_AUTHOR_CHARS}-character limit`;
  }
  return null;
}

export function validateAnchorText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "anchor_text must be a string";
  if (value.length > MAX_ANCHOR_TEXT_CHARS) {
    return `anchor_text exceeds the ${MAX_ANCHOR_TEXT_CHARS}-character limit`;
  }
  return null;
}

const ANCHOR_TYPES = new Set(["line", "selection"]);

export function validateAnchorType(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !ANCHOR_TYPES.has(value)) {
    return "anchor_type must be 'line' or 'selection'";
  }
  return null;
}

// Coerce a nullable integer field from untrusted request input. Accepts
// numbers and numeric strings (e.g. "3" from a CLI that stringifies), treats
// null/undefined/"" as absent, and rejects anything non-integer with a message.
// Prevents a bad value (e.g. selection text mistakenly sent in anchor_ref)
// from reaching Prisma and throwing an unhandled 500 — callers return 400.
export function parseNullableInt(
  value: unknown,
  field: string
): { value: number | null } | { error: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) {
    return { error: `${field} must be an integer` };
  }
  return { value: n };
}
