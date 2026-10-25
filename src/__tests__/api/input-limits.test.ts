import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";
import { MAX_CONTENT_BYTES, MAX_COMMENT_CHARS } from "@/lib/validation";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

describe("request payload limits", () => {
  it("rejects oversized doc content on create", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "a".repeat(MAX_CONTENT_BYTES + 1) }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("exceeds");
  });

  it("rejects oversized meta on create", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "# Small doc",
        meta: { blob: "x".repeat(20_000) },
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("meta");
  });

  it("rejects non-object meta on create", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "# Small doc", meta: ["nope"] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects oversized content on update", async () => {
    const rawMagicToken = generateMagicToken();
    const doc = await prisma.doc.create({
      data: {
        slug: generateSlug(),
        content: "# Small",
        visibility: "public",
        magicToken: hashToken(rawMagicToken),
        apiKey: hashToken(generateApiKey()),
      },
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": rawMagicToken,
      },
      body: JSON.stringify({ content: "a".repeat(MAX_CONTENT_BYTES + 1) }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects oversized comment bodies", async () => {
    const doc = await prisma.doc.create({
      data: {
        slug: generateSlug(),
        content: "# Comment target",
        visibility: "public",
        magicToken: hashToken(generateMagicToken()),
        apiKey: hashToken(generateApiKey()),
      },
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "a".repeat(MAX_COMMENT_CHARS + 1) }),
    });
    expect(res.status).toBe(400);
  });
});
