import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

function importBundle(body: unknown, query = "") {
  return fetch(`${BASE_URL}/api/v1/collections?format=okf${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const concept = (title: string, type: string, body = "Body.") =>
  `---\ntype: "${type}"\ntitle: "${title}"\n---\n\n# ${title}\n\n${body}\n`;

describe("POST /collections?format=okf (import)", () => {
  it("materializes a bundle into a collection of docs, ordered by index.md", async () => {
    const res = await importBundle({
      files: [
        {
          path: "index.md",
          content: "# Imported Bundle\n\n* [Chapter One](/concepts/a.md)\n* [Chapter Two](/concepts/b.md)\n",
        },
        { path: "concepts/a.md", content: concept("Alpha", "Runbook") },
        { path: "concepts/b.md", content: concept("Beta", "Guide") },
      ],
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.collection.title).toBe("Imported Bundle");
    expect(data.docs).toHaveLength(2);
    expect(data.docs.map((d: { label: string }) => d.label)).toEqual(["Chapter One", "Chapter Two"]);

    // The created collection lists the docs in order with labels preserved.
    const col = await fetch(`${BASE_URL}/api/v1/collections/${data.collection.slug}`);
    const colData = await col.json();
    expect(colData.docs.map((d: { label: string }) => d.label)).toEqual([
      "Chapter One",
      "Chapter Two",
    ]);

    // meta.type round-trips: re-export the first doc as OKF and check frontmatter.
    const okf = await fetch(`${BASE_URL}/share/${data.docs[0].slug}.okf.md`);
    const okfText = await okf.text();
    expect(okfText).toMatch(/^type: "Runbook"$/m);
    expect(okfText).toMatch(/^title: "Alpha"$/m);
  });

  it("rewrites intra-bundle concept links to the new share URLs", async () => {
    const res = await importBundle({
      files: [
        { path: "concepts/a.md", content: `---\ntype: Doc\ntitle: A\n---\n\nSee [B](/concepts/b.md).` },
        { path: "concepts/b.md", content: concept("B", "Doc") },
      ],
    });
    const data = await res.json();
    const a = data.docs.find((d: { title: string }) => d.title === "A");
    const b = data.docs.find((d: { title: string }) => d.title === "B");

    const raw = await (await fetch(`${BASE_URL}/api/v1/docs/${a.slug}?format=raw`)).text();
    expect(raw).toContain(`See [B](/share/${b.slug}).`);
  });

  it("round-trips: export a collection, then import the manifest", async () => {
    // Build a source collection with two public docs.
    const d1 = await (await fetch(`${BASE_URL}/api/v1/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "# One\n\nfirst", visibility: "public", meta: { type: "Runbook" } }),
    })).json();
    const d2 = await (await fetch(`${BASE_URL}/api/v1/docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "# Two\n\nsecond", visibility: "public" }),
    })).json();
    const col = await (await fetch(`${BASE_URL}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Source" }),
    })).json();
    await fetch(`${BASE_URL}/api/v1/collections/${col.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-magic-token": col.magic_token },
      body: JSON.stringify({ add_docs: [{ slug: d1.slug, label: "One" }, { slug: d2.slug }] }),
    });

    // Export → manifest → import.
    const manifest = await (await fetch(`${BASE_URL}/api/v1/collections/${col.slug}?format=okf`)).json();
    const res = await importBundle(manifest);
    expect(res.status).toBe(201);
    const imported = await res.json();
    expect(imported.collection.title).toBe("Source");
    expect(imported.docs).toHaveLength(2);

    const oneRaw = await (await fetch(`${BASE_URL}/api/v1/docs/${imported.docs[0].slug}?format=raw`)).text();
    expect(oneRaw).toContain("first");
  });

  it("rejects a bundle with no concept docs", async () => {
    const res = await importBundle({ files: [{ path: "index.md", content: "# Empty\n" }] });
    expect(res.status).toBe(400);
  });

  it("rejects a request without a files array", async () => {
    const res = await importBundle({ title: "nope" });
    expect(res.status).toBe(400);
  });

  it("rejects more than the file cap", async () => {
    const files = Array.from({ length: 101 }, (_, i) => ({
      path: `concepts/${i}.md`,
      content: concept(`D${i}`, "Doc"),
    }));
    const res = await importBundle({ files });
    expect(res.status).toBe(400);
  });

  it("rejects a private import without authentication", async () => {
    const res = await importBundle({
      visibility: "private",
      files: [{ path: "concepts/a.md", content: concept("A", "Doc") }],
    });
    expect(res.status).toBe(401);
  });
});
