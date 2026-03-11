import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

// Helper: create a doc directly in DB and return raw tokens
async function createTestDoc(
  overrides: {
    visibility?: string;
    title?: string;
    content?: string;
  } = {}
) {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: overrides.title ?? "Test Doc",
      content: overrides.content ?? "# Test\n\nHello world",
      visibility: overrides.visibility ?? "public",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      versions: {
        create: {
          content: overrides.content ?? "# Test\n\nHello world",
          versionNumber: 1,
        },
      },
    },
  });

  return { doc, rawMagicToken, rawApiKey };
}

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

describe("Doc CRUD", () => {
  describe("create", () => {
    it("creates a doc with slug, hashed tokens, and version", async () => {
      const { doc, rawMagicToken, rawApiKey } = await createTestDoc();

      expect(doc.slug).toHaveLength(8);
      expect(doc.magicToken).toBe(hashToken(rawMagicToken));
      expect(doc.apiKey).toBe(hashToken(rawApiKey));
      expect(doc.visibility).toBe("public");

      const versions = await prisma.docVersion.findMany({
        where: { docId: doc.id },
      });
      expect(versions).toHaveLength(1);
      expect(versions[0].versionNumber).toBe(1);
    });

    it("extracts title from H1 when no title provided", async () => {
      const slug = generateSlug();
      const rawMagicToken = generateMagicToken();
      const rawApiKey = generateApiKey();
      const content = "# Auto Title\n\nBody text";

      // Simulate what the API does
      const { extractTitleFromContent } = await import("@/lib/markdown");
      const resolvedTitle = extractTitleFromContent(content);

      const doc = await prisma.doc.create({
        data: {
          slug,
          title: resolvedTitle,
          content,
          visibility: "public",
          magicToken: hashToken(rawMagicToken),
          apiKey: hashToken(rawApiKey),
        },
      });

      expect(doc.title).toBe("Auto Title");
    });
  });

  describe("read", () => {
    it("reads a public doc without auth", async () => {
      const { doc } = await createTestDoc();
      const found = await prisma.doc.findUnique({
        where: { slug: doc.slug },
      });
      expect(found).not.toBeNull();
      expect(found!.content).toBe("# Test\n\nHello world");
    });

    it("returns null for non-existent slug", async () => {
      const found = await prisma.doc.findUnique({
        where: { slug: "nonexist" },
      });
      expect(found).toBeNull();
    });
  });

  describe("auth", () => {
    it("validates magic token by hash comparison", async () => {
      const { doc, rawMagicToken } = await createTestDoc();
      expect(doc.magicToken).toBe(hashToken(rawMagicToken));
      expect(doc.magicToken).not.toBe(hashToken("tok_wrong_token"));
    });

    it("validates api key by hash comparison", async () => {
      const { doc, rawApiKey } = await createTestDoc();
      expect(doc.apiKey).toBe(hashToken(rawApiKey));
      expect(doc.apiKey).not.toBe(hashToken("key_wrong_key"));
    });

    it("private doc requires valid token", async () => {
      const { doc, rawMagicToken } = await createTestDoc({
        visibility: "private",
      });

      // Valid token matches
      expect(doc.magicToken).toBe(hashToken(rawMagicToken));
      // Wrong token does not
      expect(doc.magicToken).not.toBe(hashToken("tok_invalid"));
    });
  });

  describe("update", () => {
    it("updates content and creates a new version", async () => {
      const { doc } = await createTestDoc();

      await prisma.doc.update({
        where: { slug: doc.slug },
        data: { content: "# Updated\n\nNew content" },
      });

      await prisma.docVersion.create({
        data: {
          docId: doc.id,
          content: "# Updated\n\nNew content",
          versionNumber: 2,
          versionNote: "Updated heading",
        },
      });

      const versions = await prisma.docVersion.findMany({
        where: { docId: doc.id },
        orderBy: { versionNumber: "asc" },
      });

      expect(versions).toHaveLength(2);
      expect(versions[1].versionNumber).toBe(2);
      expect(versions[1].content).toBe("# Updated\n\nNew content");
      expect(versions[1].versionNote).toBe("Updated heading");
    });

    it("updates visibility", async () => {
      const { doc } = await createTestDoc({ visibility: "public" });

      const updated = await prisma.doc.update({
        where: { slug: doc.slug },
        data: { visibility: "private" },
      });

      expect(updated.visibility).toBe("private");
    });
  });

  describe("GET /docs/:slug social data", () => {
    it("returns reactions_count, comments_count, and reviews", async () => {
      const { doc, rawApiKey } = await createTestDoc();

      // Add a reaction
      await prisma.reaction.create({
        data: { docId: doc.id, emoji: "thumbs_up", identifier: "user-1" },
      });
      await prisma.reaction.create({
        data: { docId: doc.id, emoji: "thumbs_up", identifier: "user-2" },
      });
      await prisma.reaction.create({
        data: { docId: doc.id, emoji: "check", identifier: "user-1" },
      });

      // Add a comment
      await prisma.comment.create({
        data: { docId: doc.id, body: "Great doc!", author: "alice" },
      });

      // Add a review
      await prisma.review.create({
        data: { docId: doc.id, reviewerName: "bob", identifier: "user-2" },
      });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.reactions_count).toEqual({ thumbs_up: 2, check: 1 });
      expect(data.comments_count).toBe(1);
      expect(data.reviews).toHaveLength(1);
      expect(data.reviews[0].reviewer_name).toBe("bob");
      expect(data.reviews[0].reviewed_at).toBeDefined();
    });
  });

  describe("delete", () => {
    it("deletes doc and cascades to versions", async () => {
      const { doc } = await createTestDoc();

      await prisma.doc.delete({ where: { slug: doc.slug } });

      const found = await prisma.doc.findUnique({
        where: { slug: doc.slug },
      });
      expect(found).toBeNull();

      const versions = await prisma.docVersion.findMany({
        where: { docId: doc.id },
      });
      expect(versions).toHaveLength(0);
    });
  });
});
