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

describe("Reviews API", () => {
  it("POST /reviews creates a review", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user-1", reviewer_name: "Alice" }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reviewer_name).toBe("Alice");
    expect(data.identifier).toBe("user-1");
  });

  it("POST /reviews defaults reviewer_name to anonymous", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user-1" }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reviewer_name).toBe("anonymous");
  });

  it("POST /reviews deduplicates by identifier", async () => {
    const { doc } = await createTestDoc();
    const payload = { identifier: "user-1", reviewer_name: "Alice" };

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res2 = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res2.status).toBe(201);

    const getRes = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`);
    const data = await getRes.json();
    expect(data.reviews).toHaveLength(1);
  });

  it("GET /reviews returns all reviews", async () => {
    const { doc } = await createTestDoc();

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user-1", reviewer_name: "Alice" }),
    });

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user-2", reviewer_name: "Bob" }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews[0].reviewer_name).toBe("Alice");
    expect(data.reviews[1].reviewer_name).toBe("Bob");
  });

  it("requires api_key for private doc reviews", async () => {
    const { doc } = await createTestDoc({ visibility: "private" });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("allows reviews on private doc with api_key", async () => {
    const { doc, rawApiKey } = await createTestDoc({ visibility: "private" });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rawApiKey}`,
      },
      body: JSON.stringify({ identifier: "user-1", reviewer_name: "Alice" }),
    });

    expect(res.status).toBe(201);
  });

  it("POST /reviews requires identifier", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewer_name: "Alice" }),
    });

    expect(res.status).toBe(400);
  });
});
