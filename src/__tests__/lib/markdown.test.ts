import { describe, it, expect } from "vitest";
import { extractTitleFromContent } from "@/lib/markdown";

describe("extractTitleFromContent", () => {
  it("extracts title from first H1", () => {
    expect(extractTitleFromContent("# My Title\n\nSome content")).toBe(
      "My Title"
    );
  });

  it("extracts title from H1 not at start", () => {
    expect(
      extractTitleFromContent("Some preamble\n# Actual Title\n\nContent")
    ).toBe("Actual Title");
  });

  it("returns null when no H1 exists", () => {
    expect(extractTitleFromContent("## Not an H1\n\nContent")).toBeNull();
  });

  it("returns null for empty content", () => {
    expect(extractTitleFromContent("")).toBeNull();
  });

  it("trims whitespace from title", () => {
    expect(extractTitleFromContent("#   Spaced Title   ")).toBe("Spaced Title");
  });
});
