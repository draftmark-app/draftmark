import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("returns an 8-character string", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(8);
  });

  it("generates URL-safe characters", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique slugs", () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});
