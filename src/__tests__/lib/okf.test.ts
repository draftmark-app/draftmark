import { describe, it, expect } from "vitest";
import {
  buildOkfConceptDoc,
  buildOkfBundle,
  OKF_VERSION,
  type OkfDocInput,
  type OkfBundleDocInput,
} from "@/lib/okf";

const BASE = "https://draftmark.app";

function doc(overrides: Partial<OkfDocInput> = {}): OkfDocInput {
  return {
    slug: "abc123",
    title: "Orders Table",
    content: "# Orders Table\n\nOne row per order.",
    meta: null,
    updatedAt: new Date("2026-05-28T14:30:00.000Z"),
    ...overrides,
  };
}

/** Pull the YAML frontmatter block (between the first two `---` lines). */
function frontmatter(out: string): string {
  const m = out.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("no frontmatter block found");
  return m[1];
}

describe("buildOkfConceptDoc", () => {
  it("emits frontmatter followed by a blank line then the raw body", () => {
    const out = buildOkfConceptDoc(doc(), BASE);
    expect(out).toMatch(/\n---\n\n# Orders Table\n\nOne row per order\.\n$/);
  });

  it("always includes a non-empty required `type` field", () => {
    const fm = frontmatter(buildOkfConceptDoc(doc(), BASE));
    expect(fm).toMatch(/^type: "Document"$/m);
  });

  it("uses meta.type when present", () => {
    const fm = frontmatter(
      buildOkfConceptDoc(doc({ meta: { type: "BigQuery Table" } }), BASE)
    );
    expect(fm).toMatch(/^type: "BigQuery Table"$/m);
  });

  it("falls back to Document when meta.type is blank or non-string", () => {
    expect(frontmatter(buildOkfConceptDoc(doc({ meta: { type: "   " } }), BASE))).toMatch(
      /^type: "Document"$/m
    );
    expect(frontmatter(buildOkfConceptDoc(doc({ meta: { type: 42 } }), BASE))).toMatch(
      /^type: "Document"$/m
    );
  });

  it("sets resource to the human share URL and timestamp to updatedAt", () => {
    const fm = frontmatter(buildOkfConceptDoc(doc(), BASE));
    expect(fm).toMatch(/^resource: "https:\/\/draftmark\.app\/share\/abc123"$/m);
    expect(fm).toMatch(/^timestamp: "2026-05-28T14:30:00\.000Z"$/m);
  });

  it("includes description and tags only when present in meta", () => {
    const bare = frontmatter(buildOkfConceptDoc(doc(), BASE));
    expect(bare).not.toMatch(/^description:/m);
    expect(bare).not.toMatch(/^tags:/m);

    const rich = frontmatter(
      buildOkfConceptDoc(
        doc({ meta: { description: "One row per order.", tags: ["sales", "revenue"] } }),
        BASE
      )
    );
    expect(rich).toMatch(/^description: "One row per order\."$/m);
    expect(rich).toMatch(/^tags: \["sales", "revenue"\]$/m);
  });

  it("drops non-string tag entries", () => {
    const fm = frontmatter(
      buildOkfConceptDoc(doc({ meta: { tags: ["ok", 3, null, "fine"] } }), BASE)
    );
    expect(fm).toMatch(/^tags: \["ok", "fine"\]$/m);
  });

  it("derives title from the first heading when title is null", () => {
    const fm = frontmatter(
      buildOkfConceptDoc(doc({ title: null, content: "# Derived Heading\n\nx" }), BASE)
    );
    expect(fm).toMatch(/^title: "Derived Heading"$/m);
  });

  it("falls back to slug when there is no title and no heading", () => {
    const fm = frontmatter(
      buildOkfConceptDoc(doc({ title: null, content: "no heading here" }), BASE)
    );
    expect(fm).toMatch(/^title: "abc123"$/m);
  });

  it("safely quotes titles containing YAML-hostile characters", () => {
    const fm = frontmatter(
      buildOkfConceptDoc(doc({ title: 'Weird: "quoted" \\ path' }), BASE)
    );
    // Escaped, still on a single line — parses as one scalar.
    expect(fm).toMatch(/^title: "Weird: \\"quoted\\" \\\\ path"$/m);
    expect(fm.split("\n").filter((l) => l.startsWith("title:"))).toHaveLength(1);
  });

  it("keeps a multi-line-hostile title on one physical line", () => {
    const out = buildOkfConceptDoc(doc({ title: "line1\nline2" }), BASE);
    const fm = frontmatter(out);
    expect(fm).toMatch(/^title: "line1\\nline2"$/m);
  });
});

function member(overrides: Partial<OkfBundleDocInput> = {}): OkfBundleDocInput {
  return { ...doc(), label: null, ...overrides };
}

describe("buildOkfBundle", () => {
  it("carries okf_version and bundle slug on the manifest", () => {
    const m = buildOkfBundle({ slug: "sales", title: "Sales" }, [], BASE);
    expect(m.okf_version).toBe(OKF_VERSION);
    expect(m.bundle).toBe("sales");
  });

  it("emits a root index.md (no frontmatter) plus one concept file per doc", () => {
    const m = buildOkfBundle(
      { slug: "sales", title: "Sales" },
      [member({ slug: "orders" }), member({ slug: "customers" })],
      BASE
    );
    const paths = m.files.map((f) => f.path);
    expect(paths).toEqual(["index.md", "concepts/orders.md", "concepts/customers.md"]);

    const index = m.files.find((f) => f.path === "index.md")!.content;
    expect(index).not.toMatch(/^---/); // reserved file has no frontmatter
    expect(index).toMatch(/^# Sales$/m);
  });

  it("lists docs in the given order using label, then title, then slug", () => {
    const m = buildOkfBundle(
      { slug: "b", title: "B" },
      [
        member({ slug: "a", label: "Chapter 1", meta: { description: "intro" } }),
        member({ slug: "b", label: null, title: "Titled" }),
        member({ slug: "c", label: null, title: null, content: "no heading" }),
      ],
      BASE
    );
    const index = m.files.find((f) => f.path === "index.md")!.content;
    expect(index).toContain("* [Chapter 1](/concepts/a.md) - intro");
    expect(index).toContain("* [Titled](/concepts/b.md)");
    expect(index).toContain("* [c](/concepts/c.md)");
  });

  it("sanitizes label text so it cannot break the markdown link", () => {
    const m = buildOkfBundle(
      { slug: "x", title: "X" },
      [member({ slug: "a", label: "we[i]rd\nlabel" })],
      BASE
    );
    const index = m.files.find((f) => f.path === "index.md")!.content;
    expect(index).toContain("* [we\\[i\\]rd label](/concepts/a.md)");
  });

  it("produces concept files that are valid OKF concept docs", () => {
    const m = buildOkfBundle(
      { slug: "x", title: "X" },
      [member({ slug: "a", meta: { type: "Runbook" } })],
      BASE
    );
    const concept = m.files.find((f) => f.path === "concepts/a.md")!.content;
    expect(concept).toMatch(/^---\ntype: "Runbook"\n/);
  });
});
