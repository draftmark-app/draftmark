import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

async function createTestDoc(
  overrides: {
    visibility?: string;
    meta?: Record<string, unknown>;
  } = {}
) {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: "Test Doc",
      content: "# Test\n\nLine 1\nLine 2\nLine 3",
      visibility: overrides.visibility ?? "public",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      meta: overrides.meta ?? undefined,
      versions: {
        create: { content: "# Test\n\nLine 1\nLine 2\nLine 3", versionNumber: 1 },
      },
    },
  });

  return { doc, rawMagicToken, rawApiKey };
}

const BASE_URL = "http://localhost:3333";

describe("Agent DX Improvements", () => {
  describe("Response filtering — owner vs reviewer", () => {
    it("hides meta and views_count from public/api_key access", async () => {
      const { doc, rawApiKey } = await createTestDoc({
        meta: { agent: "claude", session_id: "abc123" },
      });

      // Public access (no auth)
      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.meta).toBeUndefined();
      expect(data.views_count).toBeUndefined();
      expect(data.slug).toBe(doc.slug);
      expect(data.content).toBeDefined();

      // API key access (reviewer)
      const res2 = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`, {
        headers: { Authorization: `Bearer ${rawApiKey}` },
      });
      const data2 = await res2.json();
      expect(data2.meta).toBeUndefined();
      expect(data2.views_count).toBeUndefined();
    });

    it("shows meta and views_count to owner (magic_token)", async () => {
      const { doc, rawMagicToken } = await createTestDoc({
        meta: { agent: "claude", session_id: "abc123" },
      });

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}?token=${rawMagicToken}`
      );
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.meta).toEqual({ agent: "claude", session_id: "abc123" });
      expect(data.views_count).toBeDefined();
    });
  });

  describe("GET /docs/:slug?format=raw", () => {
    it("returns raw markdown content with text/markdown content type", async () => {
      const { doc } = await createTestDoc();

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}?format=raw`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/markdown");

      const text = await res.text();
      expect(text).toBe("# Test\n\nLine 1\nLine 2\nLine 3");
    });

    it("works with api_key for private docs", async () => {
      const { doc, rawApiKey } = await createTestDoc({ visibility: "private" });

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}?format=raw`,
        { headers: { Authorization: `Bearer ${rawApiKey}` } }
      );
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("# Test\n\nLine 1\nLine 2\nLine 3");
    });

    it("rejects raw format on private docs without auth", async () => {
      const { doc } = await createTestDoc({ visibility: "private" });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}?format=raw`);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /docs/:slug/comments/batch", () => {
    it("creates multiple comments in one request", async () => {
      const { doc } = await createTestDoc();

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: [
              { body: "Comment on line 1", author: "agent-1", anchor_type: "line", anchor_ref: "1" },
              { body: "Comment on line 2", author: "agent-1", anchor_type: "line", anchor_ref: "2" },
              { body: "General feedback", author: "agent-1" },
            ],
          }),
        }
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.created).toBe(3);
      expect(data.comments).toHaveLength(3);
      expect(data.comments[0].body).toBe("Comment on line 1");
      expect(data.comments[0].anchor_type).toBe("line");
      expect(data.comments[2].body).toBe("General feedback");
    });

    it("rejects empty comments array", async () => {
      const { doc } = await createTestDoc();

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: [] }),
        }
      );
      expect(res.status).toBe(400);
    });

    it("rejects batch with invalid comment (missing body)", async () => {
      const { doc } = await createTestDoc();

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: [
              { body: "Valid comment", author: "agent" },
              { author: "agent" }, // missing body
            ],
          }),
        }
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("index 1");
    });

    it("rejects batch exceeding 50 comments", async () => {
      const { doc } = await createTestDoc();

      const comments = Array.from({ length: 51 }, (_, i) => ({
        body: `Comment ${i}`,
        author: "agent",
      }));

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments }),
        }
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("50");
    });

    it("requires api_key for private docs", async () => {
      const { doc } = await createTestDoc({ visibility: "private" });

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${doc.slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: [{ body: "Test", author: "agent" }],
          }),
        }
      );
      expect(res.status).toBe(401);
    });

    it("respects feedback gates (closed doc)", async () => {
      const slug = generateSlug();
      const rawMagicToken = generateMagicToken();
      await prisma.doc.create({
        data: {
          slug,
          title: "Closed Doc",
          content: "# Closed",
          visibility: "public",
          status: "review_closed",
          magicToken: hashToken(rawMagicToken),
          apiKey: hashToken(generateApiKey()),
          versions: { create: { content: "# Closed", versionNumber: 1 } },
        },
      });

      const res = await fetch(
        `${BASE_URL}/api/v1/docs/${slug}/comments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: [{ body: "Late feedback", author: "agent" }],
          }),
        }
      );
      expect(res.status).toBe(409);
    });
  });
});
