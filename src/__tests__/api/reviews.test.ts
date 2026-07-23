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
    // Dedup identity is server-derived and no longer exposed in the response.
    expect(data.identifier).toBeUndefined();
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

    // Distinct reviewers are simulated via distinct client IPs.
    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.1" },
      body: JSON.stringify({ reviewer_name: "Alice" }),
    });

    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.2" },
      body: JSON.stringify({ reviewer_name: "Bob" }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews[0].reviewer_name).toBe("Alice");
    expect(data.reviews[1].reviewer_name).toBe("Bob");
    // Server-derived identity is not leaked to readers.
    expect(data.reviews[0].identifier).toBeUndefined();
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

  it("POST /reviews no longer requires a client identifier", async () => {
    const { doc } = await createTestDoc();
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewer_name: "Alice" }),
    });

    expect(res.status).toBe(201);
  });

  it("dedups by server-derived identity even when the client varies its identifier", async () => {
    const { doc } = await createTestDoc();
    const ip = "203.0.113.77";

    // Same client IP, different client-supplied identifiers — the old exploit
    // that could inflate counts and flip review_complete. Must count as ONE.
    for (const identifier of ["x", "y", "z"]) {
      await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": ip },
        body: JSON.stringify({ identifier, reviewer_name: "Spammer" }),
      });
    }

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`);
    const data = await res.json();
    expect(data.reviews).toHaveLength(1);
  });

  it("GET /reviews flags the caller's own review with mine", async () => {
    const { doc } = await createTestDoc();
    const mineIp = "203.0.113.101";
    const otherIp = "203.0.113.102";

    // Alice reviews from mineIp; Bob from otherIp (distinct server-derived identities).
    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": mineIp },
      body: JSON.stringify({ reviewer_name: "Alice" }),
    });
    await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": otherIp },
      body: JSON.stringify({ reviewer_name: "Bob" }),
    });

    // Reading as mineIp: only Alice's review is "mine".
    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
      headers: { "cf-connecting-ip": mineIp },
    });
    const data = await res.json();
    const alice = data.reviews.find((r: { reviewer_name: string }) => r.reviewer_name === "Alice");
    const bob = data.reviews.find((r: { reviewer_name: string }) => r.reviewer_name === "Bob");
    expect(alice.mine).toBe(true);
    expect(bob.mine).toBe(false);
  });

  it("dedups same IP across different User-Agents (UA is not a spoofing dimension)", async () => {
    const { doc } = await createTestDoc();
    const ip = "203.0.113.88";

    for (const ua of ["Mozilla/5.0 A", "Mozilla/5.0 B", "curl/8.0"]) {
      await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": ip, "user-agent": ua },
        body: JSON.stringify({ reviewer_name: "Spammer" }),
      });
    }

    const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`);
    const data = await res.json();
    expect(data.reviews).toHaveLength(1);
  });
});
