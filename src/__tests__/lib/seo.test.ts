import { describe, it, expect } from "vitest";
import { buildMetaDescription } from "@/lib/seo";

describe("buildMetaDescription", () => {
  it("derives a description from the body when no custom one is set", () => {
    const doc = {
      content: "# Title\nThis is the **body** of the document.",
      meta: null,
    };
    expect(buildMetaDescription(doc)).toBe("This is the body of the document.");
  });

  it("strips heading lines and inline markdown syntax", () => {
    const doc = {
      content: "# Heading\n## Sub\nSome `code` and _emphasis_ and [links].",
      meta: undefined,
    };
    expect(buildMetaDescription(doc)).toBe("Some code and emphasis and links.");
  });

  it("slices the auto-generated description to 160 chars", () => {
    const doc = { content: "x".repeat(500), meta: null };
    expect(buildMetaDescription(doc)).toHaveLength(160);
  });

  it("strips a heading on the last line (no trailing newline)", () => {
    expect(
      buildMetaDescription({ content: "# Only a heading", meta: null }),
    ).toBe("");
    expect(
      buildMetaDescription({ content: "Body text.\n# Trailing", meta: null }),
    ).toBe("Body text.");
  });

  it("does not treat '#hashtag' (no space) as a heading", () => {
    const doc = { content: "#hashtag rocks", meta: null };
    expect(buildMetaDescription(doc)).toBe("#hashtag rocks");
  });

  it("does not cut a multi-byte glyph into a broken surrogate", () => {
    const doc = { content: "a".repeat(159) + "😀", meta: null };
    const result = buildMetaDescription(doc);
    // 159 'a' + the emoji would be 160 code points; emoji kept whole, no U+FFFD.
    expect(result).not.toContain("�");
    expect(result.endsWith("😀")).toBe(true);
  });

  it("prefers a curated meta.seoDescription over the body", () => {
    const doc = {
      content: "# Title\nRaw body text that should be ignored.",
      meta: { seoDescription: "A curated, complete SEO description." },
    };
    expect(buildMetaDescription(doc)).toBe(
      "A curated, complete SEO description.",
    );
  });

  it("trims the curated description", () => {
    const doc = {
      content: "body",
      meta: { seoDescription: "  padded  " },
    };
    expect(buildMetaDescription(doc)).toBe("padded");
  });

  it("keeps a curated description longer than 160 chars (up to 320)", () => {
    const long = "A ".repeat(100).trim(); // ~199 chars
    const doc = { content: "body", meta: { seoDescription: long } };
    const result = buildMetaDescription(doc);
    expect(result).toBe(long);
    expect(result.length).toBeGreaterThan(160);
  });

  it("caps an absurdly long curated description at 320 chars", () => {
    const doc = { content: "body", meta: { seoDescription: "z".repeat(500) } };
    expect(buildMetaDescription(doc)).toHaveLength(320);
  });

  it("falls back to the body when seoDescription is blank", () => {
    const doc = { content: "the body", meta: { seoDescription: "   " } };
    expect(buildMetaDescription(doc)).toBe("the body");
  });

  it("ignores a non-string seoDescription", () => {
    const doc = { content: "the body", meta: { seoDescription: 42 } };
    expect(buildMetaDescription(doc)).toBe("the body");
  });

  it("coexists with other user-supplied meta keys", () => {
    const doc = {
      content: "the body",
      meta: {
        agent: "claude-code",
        source_file: "docs/plan.md",
        seoDescription: "Curated copy.",
      },
    };
    expect(buildMetaDescription(doc)).toBe("Curated copy.");
  });

  it("handles meta that is an array without crashing", () => {
    const doc = { content: "the body", meta: ["not", "an", "object"] };
    expect(buildMetaDescription(doc)).toBe("the body");
  });
});
