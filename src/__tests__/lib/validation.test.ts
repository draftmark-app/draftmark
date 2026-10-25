import { describe, it, expect } from "vitest";
import {
  MAX_CONTENT_BYTES,
  MAX_TITLE_CHARS,
  MAX_META_BYTES,
  MAX_COMMENT_CHARS,
  validateContent,
  validateTitle,
  validateVersionNote,
  validateMeta,
  validateCommentBody,
  validateAuthor,
  validateAnchorText,
  validateAnchorType,
} from "@/lib/validation";

describe("validateContent", () => {
  it("requires a non-empty string", () => {
    expect(validateContent(undefined)).not.toBeNull();
    expect(validateContent("")).not.toBeNull();
    expect(validateContent(42)).not.toBeNull();
  });

  it("accepts content at the limit and rejects one byte over", () => {
    expect(validateContent("a".repeat(MAX_CONTENT_BYTES))).toBeNull();
    expect(validateContent("a".repeat(MAX_CONTENT_BYTES + 1))).not.toBeNull();
  });

  it("counts UTF-8 bytes, not characters", () => {
    // 4-byte emoji: 250_001 of them exceed 1 MB even though the string is short.
    expect(validateContent("😀".repeat(250_001))).not.toBeNull();
  });
});

describe("validateTitle / validateVersionNote", () => {
  it("allows null and undefined", () => {
    expect(validateTitle(null)).toBeNull();
    expect(validateVersionNote(undefined)).toBeNull();
  });

  it("rejects non-strings and over-long values", () => {
    expect(validateTitle(1)).not.toBeNull();
    expect(validateTitle("t".repeat(MAX_TITLE_CHARS + 1))).not.toBeNull();
    expect(validateVersionNote(1)).not.toBeNull();
  });
});

describe("validateMeta", () => {
  it("allows undefined and objects", () => {
    expect(validateMeta(undefined)).toBeNull();
    expect(validateMeta({ agent: "claude" })).toBeNull();
  });

  it("rejects arrays, primitives, and oversized payloads", () => {
    expect(validateMeta([])).not.toBeNull();
    expect(validateMeta("meta")).not.toBeNull();
    expect(validateMeta({ blob: "x".repeat(MAX_META_BYTES) })).not.toBeNull();
  });
});

describe("comment field validation", () => {
  it("requires a non-empty body and enforces the cap", () => {
    expect(validateCommentBody("  ")).not.toBeNull();
    expect(validateCommentBody("a".repeat(MAX_COMMENT_CHARS + 1))).not.toBeNull();
    expect(validateCommentBody("hello")).toBeNull();
  });

  it("validates author and anchor text types/lengths", () => {
    expect(validateAuthor(1)).not.toBeNull();
    expect(validateAnchorText(1)).not.toBeNull();
    expect(validateAuthor("alice")).toBeNull();
    expect(validateAnchorText("quote")).toBeNull();
  });

  it("only accepts known anchor types", () => {
    expect(validateAnchorType("line")).toBeNull();
    expect(validateAnchorType("selection")).toBeNull();
    expect(validateAnchorType("bogus")).not.toBeNull();
  });
});
