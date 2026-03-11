import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

const BASE_URL = "http://localhost:3333";

async function createTestDoc(overrides: { visibility?: string } = {}) {
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

async function createTestCollection() {
  const res = await fetch(`${BASE_URL}/api/v1/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test Collection" }),
  });
  return res.json();
}

describe("Collections API", () => {
  it("POST /collections creates a collection", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Collection" }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toHaveLength(8);
    expect(data.title).toBe("My Collection");
    expect(data.magic_token).toMatch(/^tok_/);
    expect(data.api_key).toMatch(/^key_/);
    expect(data.url).toContain(`/c/${data.slug}`);
  });

  it("POST /collections requires title", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it("GET /collections/:slug returns collection with docs", async () => {
    const collection = await createTestCollection();
    const { doc } = await createTestDoc();

    // Add doc to collection
    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({
        add_docs: [{ slug: doc.slug, label: "Chapter 1" }],
      }),
    });

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slug).toBe(collection.slug);
    expect(data.title).toBe("Test Collection");
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].slug).toBe(doc.slug);
    expect(data.docs[0].label).toBe("Chapter 1");
  });

  it("GET /collections/:slug returns 404 for missing collection", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/collections/nonexist`);
    expect(res.status).toBe(404);
  });

  it("PATCH /collections/:slug adds and removes docs", async () => {
    const collection = await createTestCollection();
    const { doc: doc1 } = await createTestDoc();
    const { doc: doc2 } = await createTestDoc();

    // Add two docs
    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({
        add_docs: [
          { slug: doc1.slug, label: "First" },
          { slug: doc2.slug, label: "Second" },
        ],
      }),
    });

    // Remove first doc
    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-magic-token": collection.magic_token,
        },
        body: JSON.stringify({ remove_docs: [doc1.slug] }),
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].slug).toBe(doc2.slug);
  });

  it("PATCH /collections/:slug reorders docs", async () => {
    const collection = await createTestCollection();
    const { doc: doc1 } = await createTestDoc();
    const { doc: doc2 } = await createTestDoc();

    // Add docs
    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({
        add_docs: [{ slug: doc1.slug }, { slug: doc2.slug }],
      }),
    });

    // Reorder: swap positions
    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-magic-token": collection.magic_token,
        },
        body: JSON.stringify({
          reorder: [
            { slug: doc1.slug, position: 1 },
            { slug: doc2.slug, position: 0 },
          ],
        }),
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.docs[0].slug).toBe(doc2.slug);
    expect(data.docs[1].slug).toBe(doc1.slug);
  });

  it("PATCH /collections/:slug updates title", async () => {
    const collection = await createTestCollection();

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-magic-token": collection.magic_token,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Updated Title");
  });

  it("PATCH /collections/:slug requires magic token", async () => {
    const collection = await createTestCollection();

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Hacked" }),
      }
    );

    expect(res.status).toBe(401);
  });

  it("DELETE /collections/:slug deletes the collection", async () => {
    const collection = await createTestCollection();

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "DELETE",
        headers: { "x-magic-token": collection.magic_token },
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);

    // Verify it's gone
    const check = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`
    );
    expect(check.status).toBe(404);
  });

  it("DELETE /collections/:slug requires magic token", async () => {
    const collection = await createTestCollection();

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      { method: "DELETE" }
    );

    expect(res.status).toBe(401);
  });

  it("PATCH /collections/:slug deduplicates adding same doc twice", async () => {
    const collection = await createTestCollection();
    const { doc } = await createTestDoc();

    // Add same doc twice
    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({
        add_docs: [{ slug: doc.slug, label: "First" }],
      }),
    });

    const res = await fetch(
      `${BASE_URL}/api/v1/collections/${collection.slug}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-magic-token": collection.magic_token,
        },
        body: JSON.stringify({
          add_docs: [{ slug: doc.slug, label: "Updated" }],
        }),
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].label).toBe("Updated");
  });
});
