import { describe, it, expect } from "vitest";
import {
  parseOkfImport,
  splitFrontmatter,
  rewriteImportLinks,
  type OkfImportManifest,
} from "@/lib/okf-import";

function manifest(files: { path: string; content: string }[], bundle?: string): OkfImportManifest {
  return { okf_version: "0.1", bundle, files };
}

const concept = (title: string, type: string, body = "Body.") =>
  `---\ntype: "${type}"\ntitle: "${title}"\n---\n\n# ${title}\n\n${body}\n`;

describe("splitFrontmatter", () => {
  it("parses a YAML frontmatter block and returns the body", () => {
    const { frontmatter, body } = splitFrontmatter(
      `---\ntype: Runbook\ntitle: Orders\ntags: [a, b]\n---\n\n# Orders\n\nHi.`
    );
    expect(frontmatter).toMatchObject({ type: "Runbook", title: "Orders", tags: ["a", "b"] });
    expect(body).toBe("# Orders\n\nHi.");
  });

  it("tolerates a missing frontmatter block", () => {
    const { frontmatter, body } = splitFrontmatter("# No Frontmatter\n\nJust body.");
    expect(frontmatter).toBeNull();
    expect(body).toBe("# No Frontmatter\n\nJust body.");
  });

  it("tolerates malformed YAML by treating it as no frontmatter", () => {
    const { frontmatter, body } = splitFrontmatter(`---\n: : : not: valid: yaml\n---\n\nbody`);
    // Either it parsed to a non-mapping/failed → null; body must be preserved.
    expect(frontmatter).toBeNull();
    expect(body).toContain("body");
  });

  it("handles block-sequence tags (foreign YAML style)", () => {
    const { frontmatter } = splitFrontmatter(
      `---\ntype: Doc\ntags:\n  - sales\n  - revenue\n---\n\nbody`
    );
    expect(frontmatter?.tags).toEqual(["sales", "revenue"]);
  });
});

describe("parseOkfImport", () => {
  it("turns concept docs into importable docs with meta round-tripped", () => {
    const res = parseOkfImport(
      manifest([
        { path: "index.md", content: "# My Bundle\n\n* [Orders](/concepts/orders.md)\n" },
        {
          path: "concepts/orders.md",
          content: `---\ntype: "Runbook"\ntitle: "Orders"\ndescription: "One per order"\ntags: ["sales"]\n---\n\n# Orders\n\nrows`,
        },
      ])
    );
    expect(res.collectionTitle).toBe("My Bundle");
    expect(res.docs).toHaveLength(1);
    expect(res.docs[0]).toMatchObject({
      originalPath: "concepts/orders.md",
      title: "Orders",
      label: "Orders",
      meta: { type: "Runbook", description: "One per order", tags: ["sales"] },
    });
    expect(res.docs[0].content).toBe("# Orders\n\nrows");
  });

  it("skips reserved files (index.md, log.md) and the okf.json sidecar", () => {
    const res = parseOkfImport(
      manifest([
        { path: "okf.json", content: '{"okf_version":"0.1"}' },
        { path: "index.md", content: "# B\n" },
        { path: "log.md", content: "# Log\n" },
        { path: "concepts/a.md", content: concept("A", "Doc") },
      ])
    );
    expect(res.docs.map((d) => d.originalPath)).toEqual(["concepts/a.md"]);
  });

  it("orders docs by index.md, appending unlisted concepts in file order", () => {
    const res = parseOkfImport(
      manifest([
        {
          path: "index.md",
          content: "# B\n\n* [Second](/concepts/b.md)\n* [First](/concepts/a.md)\n",
        },
        { path: "concepts/a.md", content: concept("A", "Doc") },
        { path: "concepts/b.md", content: concept("B", "Doc") },
        { path: "concepts/c.md", content: concept("C", "Doc") }, // not in index
      ])
    );
    expect(res.docs.map((d) => d.originalPath)).toEqual([
      "concepts/b.md",
      "concepts/a.md",
      "concepts/c.md",
    ]);
    expect(res.docs.map((d) => d.label)).toEqual(["Second", "First", null]);
  });

  it("derives title from the body H1 when frontmatter has none", () => {
    const res = parseOkfImport(
      manifest([{ path: "concepts/a.md", content: `---\ntype: Doc\n---\n\n# Derived\n\nx` }])
    );
    expect(res.docs[0].title).toBe("Derived");
  });

  it("retains resource/timestamp as namespaced provenance", () => {
    const res = parseOkfImport(
      manifest([
        {
          path: "concepts/a.md",
          content: `---\ntype: Doc\nresource: https://x/share/a\ntimestamp: 2026-05-01T00:00:00Z\n---\n\nbody`,
        },
      ])
    );
    expect(res.docs[0].meta).toMatchObject({
      okf_resource: "https://x/share/a",
      okf_timestamp: "2026-05-01T00:00:00Z",
    });
  });

  it("falls back to bundle name then a default for the collection title", () => {
    expect(parseOkfImport(manifest([], "sales")).collectionTitle).toBe("sales");
    expect(parseOkfImport(manifest([])).collectionTitle).toBe("Imported Collection");
    expect(parseOkfImport(manifest([]), { defaultTitle: "Fallback" }).collectionTitle).toBe(
      "Fallback"
    );
  });

  it("imports a frontmatter-less concept doc (tolerance)", () => {
    const res = parseOkfImport(
      manifest([{ path: "concepts/raw.md", content: "# Raw\n\nno frontmatter here" }])
    );
    expect(res.docs).toHaveLength(1);
    expect(res.docs[0].title).toBe("Raw");
    expect(res.docs[0].meta).toEqual({});
  });
});

describe("rewriteImportLinks", () => {
  const map = new Map([
    ["concepts/orders.md", "newOrd"],
    ["concepts/customers.md", "newCust"],
  ]);

  it("rewrites concept links to the new share URLs", () => {
    const out = rewriteImportLinks("See [orders](/concepts/orders.md) and [cust](concepts/customers.md).", map);
    expect(out).toBe("See [orders](/share/newOrd) and [cust](/share/newCust).");
  });

  it("preserves a #fragment", () => {
    expect(rewriteImportLinks("[o](/concepts/orders.md#totals)", map)).toBe("[o](/share/newOrd#totals)");
  });

  it("leaves links to non-imported paths and external URLs alone", () => {
    expect(rewriteImportLinks("[x](/concepts/unknown.md)", map)).toBe("[x](/concepts/unknown.md)");
    expect(rewriteImportLinks("[y](https://x/concepts/orders.md)", map)).toBe(
      "[y](https://x/concepts/orders.md)"
    );
  });

  it("does not rewrite inside fenced code", () => {
    const src = "prose [a](/concepts/orders.md)\n\n```\ncode [a](/concepts/orders.md)\n```\n";
    const out = rewriteImportLinks(src, map);
    expect(out).toContain("prose [a](/share/newOrd)");
    expect(out).toContain("code [a](/concepts/orders.md)");
  });
});
