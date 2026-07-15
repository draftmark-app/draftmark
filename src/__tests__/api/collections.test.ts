import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

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

  it("PATCH add_docs skips a private doc when no ownership token is provided", async () => {
    const collection = await createTestCollection();
    const { doc } = await createTestDoc({ visibility: "private" });

    // Attacker knows the slug but not the doc's magic token.
    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({ add_docs: [{ slug: doc.slug }] }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`);
    const data = await res.json();
    expect(data.docs).toHaveLength(0);
  });

  it("PATCH add_docs adds a private doc when the correct doc token is provided, and masks its metadata", async () => {
    const collection = await createTestCollection();
    const { doc, rawMagicToken } = await createTestDoc({ visibility: "private" });

    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({
        add_docs: [{ slug: doc.slug, token: rawMagicToken }],
      }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`);
    const data = await res.json();
    expect(data.docs).toHaveLength(1);
    const member = data.docs[0];
    expect(member.slug).toBe(doc.slug);
    expect(member.visibility).toBe("private");
    // Private members must not leak content-derived title or owner-only views.
    expect(member.title).toBeNull();
    expect(member.views_count).toBeNull();
  });

  it("GET /collections/:slug still exposes public members' title and views_count", async () => {
    const collection = await createTestCollection();
    const { doc } = await createTestDoc(); // public

    await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-magic-token": collection.magic_token,
      },
      body: JSON.stringify({ add_docs: [{ slug: doc.slug }] }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}`);
    const data = await res.json();
    expect(data.docs[0].title).toBe("Test Doc");
    expect(typeof data.docs[0].views_count).toBe("number");
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

  describe("GET /collections/:slug?format=okf", () => {
    async function createDocWithMeta(overrides: {
      visibility?: string;
      meta?: Record<string, unknown>;
      content?: string;
    } = {}) {
      const slug = generateSlug();
      const rawMagicToken = generateMagicToken();
      const doc = await prisma.doc.create({
        data: {
          slug,
          title: "Meta Doc",
          content: overrides.content ?? "# Meta Doc\n\nBody.",
          visibility: overrides.visibility ?? "public",
          magicToken: hashToken(rawMagicToken),
          apiKey: hashToken(generateApiKey()),
          meta: overrides.meta,
        },
      });
      return { doc, rawMagicToken };
    }

    async function addDoc(
      collectionSlug: string,
      magicToken: string,
      entry: Record<string, unknown>
    ) {
      await fetch(`${BASE_URL}/api/v1/collections/${collectionSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-magic-token": magicToken },
        body: JSON.stringify({ add_docs: [entry] }),
      });
    }

    it("returns a manifest with index.md and one concept file per public doc", async () => {
      const collection = await createTestCollection();
      const { doc: d1 } = await createDocWithMeta({
        meta: { type: "Runbook", description: "First." },
      });
      const { doc: d2 } = await createDocWithMeta();

      await addDoc(collection.slug, collection.magic_token, { slug: d1.slug, label: "Chapter 1" });
      await addDoc(collection.slug, collection.magic_token, { slug: d2.slug });

      const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}?format=okf`);
      expect(res.status).toBe(200);
      const m = await res.json();

      expect(m.okf_version).toBe("0.1");
      expect(m.bundle).toBe(collection.slug);
      const paths = m.files.map((f: { path: string }) => f.path);
      expect(paths).toEqual([
        "index.md",
        `concepts/${d1.slug}.md`,
        `concepts/${d2.slug}.md`,
      ]);

      const index = m.files.find((f: { path: string }) => f.path === "index.md").content;
      expect(index).toContain("# Test Collection");
      expect(index).toContain(`* [Chapter 1](/concepts/${d1.slug}.md) - First.`);

      const concept = m.files.find(
        (f: { path: string }) => f.path === `concepts/${d1.slug}.md`
      ).content;
      expect(concept).toMatch(/^---\ntype: "Runbook"\n/);
    });

    it("excludes private docs for anonymous callers (no content leak)", async () => {
      const collection = await createTestCollection();
      const { doc: pub } = await createDocWithMeta();
      const { doc: priv, rawMagicToken: privToken } = await createDocWithMeta({
        visibility: "private",
        content: "# Secret Runbook\n\nclassified",
        meta: { type: "Secret" },
      });

      await addDoc(collection.slug, collection.magic_token, { slug: pub.slug });
      // Private doc requires its own token proof to attach.
      await addDoc(collection.slug, collection.magic_token, { slug: priv.slug, token: privToken });

      const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}?format=okf`);
      const m = await res.json();
      const paths = m.files.map((f: { path: string }) => f.path);

      expect(paths).toContain(`concepts/${pub.slug}.md`);
      expect(paths).not.toContain(`concepts/${priv.slug}.md`);
      expect(JSON.stringify(m)).not.toContain("classified");
      expect(JSON.stringify(m)).not.toContain(priv.slug);
    });

    it("includes private docs for the collection owner (magic token)", async () => {
      const collection = await createTestCollection();
      const { doc: priv, rawMagicToken: privToken } = await createDocWithMeta({
        visibility: "private",
        content: "# Secret Runbook\n\nclassified",
        meta: { type: "Secret" },
      });
      await addDoc(collection.slug, collection.magic_token, { slug: priv.slug, token: privToken });

      const res = await fetch(
        `${BASE_URL}/api/v1/collections/${collection.slug}?format=okf&token=${collection.magic_token}`
      );
      const m = await res.json();
      const paths = m.files.map((f: { path: string }) => f.path);
      expect(paths).toContain(`concepts/${priv.slug}.md`);
      const concept = m.files.find(
        (f: { path: string }) => f.path === `concepts/${priv.slug}.md`
      ).content;
      expect(concept).toContain("classified");
    });

    it("includes private docs for the collection owner (api key)", async () => {
      const collection = await createTestCollection();
      const { doc: priv, rawMagicToken: privToken } = await createDocWithMeta({
        visibility: "private",
        content: "# Secret\n\nclassified",
      });
      await addDoc(collection.slug, collection.magic_token, { slug: priv.slug, token: privToken });

      const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}?format=okf`, {
        headers: { Authorization: `Bearer ${collection.api_key}` },
      });
      const m = await res.json();
      const paths = m.files.map((f: { path: string }) => f.path);
      expect(paths).toContain(`concepts/${priv.slug}.md`);
    });

    it("returns 404 for an unknown collection", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/collections/does-not-exist?format=okf`);
      expect(res.status).toBe(404);
    });

    it("returns a gzipped tarball with ?archive=tar", async () => {
      const collection = await createTestCollection();
      const { doc: d1 } = await createDocWithMeta({ meta: { type: "Runbook" } });
      await addDoc(collection.slug, collection.magic_token, { slug: d1.slug });

      const res = await fetch(
        `${BASE_URL}/api/v1/collections/${collection.slug}?format=okf&archive=tar`
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/gzip");
      expect(res.headers.get("content-disposition")).toContain(
        `${collection.slug}.okf.tar.gz`
      );

      const { gunzipSync } = await import("node:zlib");
      const tar = gunzipSync(Buffer.from(await res.arrayBuffer()));
      const text = tar.toString("binary");
      // ustar magic proves it is a real tar; entries are nested under {bundle}/.
      expect(text).toContain("ustar");
      expect(text).toContain(`${collection.slug}/okf.json`);
      expect(text).toContain(`${collection.slug}/concepts/${d1.slug}.md`);
    });

    it("serves the tarball via the /c/:slug.okf download route", async () => {
      const collection = await createTestCollection();
      const { doc: d1 } = await createDocWithMeta();
      await addDoc(collection.slug, collection.magic_token, { slug: d1.slug });

      const res = await fetch(`${BASE_URL}/c/${collection.slug}.okf`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/gzip");

      const { gunzipSync } = await import("node:zlib");
      const tar = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("binary");
      expect(tar).toContain(`${collection.slug}/index.md`);
    });

    it("rewrites intra-bundle links to concept paths", async () => {
      const collection = await createTestCollection();
      const { doc: target } = await createDocWithMeta();
      const { doc: source } = await createDocWithMeta({
        content: `# Source\n\nSee [the target](/share/${target.slug}) for more.`,
      });
      await addDoc(collection.slug, collection.magic_token, { slug: target.slug });
      await addDoc(collection.slug, collection.magic_token, { slug: source.slug });

      const res = await fetch(`${BASE_URL}/api/v1/collections/${collection.slug}?format=okf`);
      const m = await res.json();
      const concept = m.files.find(
        (f: { path: string }) => f.path === `concepts/${source.slug}.md`
      ).content;
      expect(concept).toContain(`See [the target](/concepts/${target.slug}.md) for more.`);
    });

    it("excludes private docs from an anonymous tarball", async () => {
      const collection = await createTestCollection();
      const { doc: priv, rawMagicToken: privToken } = await createDocWithMeta({
        visibility: "private",
        content: "# Secret\n\nclassified",
      });
      await addDoc(collection.slug, collection.magic_token, { slug: priv.slug, token: privToken });

      const res = await fetch(`${BASE_URL}/c/${collection.slug}.okf`);
      const { gunzipSync } = await import("node:zlib");
      const tar = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("binary");
      expect(tar).not.toContain("classified");
      expect(tar).not.toContain(priv.slug);
    });
  });
});
