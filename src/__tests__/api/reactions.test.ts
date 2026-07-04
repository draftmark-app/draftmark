import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

async function createTestDoc(
  overrides: { visibility?: string } = {}
) {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: "Test Doc",
      content: "# Test\n\nHello world",
      visibility: overrides.visibility ?? "public",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
    },
  });

  return { doc, rawMagicToken, rawApiKey };
}

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

describe("Reactions API", () => {
  it("POST /reactions creates a reaction", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: "thumbs_up", identifier: "user-1" }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.emoji).toBe("thumbs_up");
    // Dedup identity is server-derived; the client identifier is not echoed.
    expect(data.identifier).toBeUndefined();
  });

  it("POST /reactions deduplicates same emoji+identifier", async () => {
    const { doc } = await createTestDoc();
    const payload = { emoji: "check", identifier: "user-1" };

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res2 = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res2.status).toBe(201);

    // Should still only have one reaction
    const getRes = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`);
    const data = await getRes.json();
    expect(data.reactions.check).toBe(1);
  });

  it("POST /reactions allows different emojis from same identifier", async () => {
    const { doc } = await createTestDoc();

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: "thumbs_up", identifier: "user-1" }),
    });

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: "check", identifier: "user-1" }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`);
    const data = await res.json();
    expect(data.reactions.thumbs_up).toBe(1);
    expect(data.reactions.check).toBe(1);
  });

  it("POST /reactions rejects invalid emoji", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: "heart", identifier: "user-1" }),
    });

    expect(res.status).toBe(400);
  });

  it("GET /reactions returns grouped counts", async () => {
    const { doc } = await createTestDoc();

    // Distinct clients are simulated via distinct client IPs (cf-connecting-ip).
    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.1" },
      body: JSON.stringify({ emoji: "thumbs_up" }),
    });

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.2" },
      body: JSON.stringify({ emoji: "thumbs_up" }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reactions.thumbs_up).toBe(2);
    expect(data.reactions.check).toBe(0);
    expect(data.reactions.thinking).toBe(0);
    expect(data.reactions.cross).toBe(0);
  });

  it("dedups by server-derived identity even when the client varies its identifier", async () => {
    const { doc } = await createTestDoc();
    const ip = "203.0.113.99";

    // Same client IP, three different client-supplied identifiers — the old
    // exploit. Must still count as ONE reaction.
    for (const identifier of ["a", "b", "c"]) {
      await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": ip },
        body: JSON.stringify({ emoji: "thumbs_up", identifier }),
      });
    }

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`);
    const data = await res.json();
    expect(data.reactions.thumbs_up).toBe(1);
  });

  it("requires api_key for private doc reactions", async () => {
    const { doc } = await createTestDoc({ visibility: "private" });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: "thumbs_up", identifier: "user-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("allows reactions on private doc with api_key", async () => {
    const { doc, rawApiKey } = await createTestDoc({ visibility: "private" });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rawApiKey}`,
      },
      body: JSON.stringify({ emoji: "thumbs_up", identifier: "user-1" }),
    });

    expect(res.status).toBe(201);
  });
});
