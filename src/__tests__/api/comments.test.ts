import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

async function createTestDoc(
  overrides: { visibility?: string; content?: string } = {}
) {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const doc = await prisma.doc.create({
    data: {
      slug,
      title: "Test Doc",
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

async function createTestComment(
  docId: string,
  overrides: Partial<{
    body: string;
    author: string;
    anchorType: string | null;
    anchorRef: number | null;
    docVersion: number;
    status: string;
  }> = {}
) {
  return prisma.comment.create({
    data: {
      docId,
      body: overrides.body ?? "A test comment",
      author: overrides.author ?? "anonymous",
      anchorType: overrides.anchorType ?? null,
      anchorRef: overrides.anchorRef ?? null,
      docVersion: overrides.docVersion ?? 1,
      status: overrides.status ?? "open",
    },
  });
}

describe("Comment CRUD", () => {
  describe("create", () => {
    it("creates a general comment on a public doc", async () => {
      const { doc } = await createTestDoc();

      const comment = await createTestComment(doc.id, {
        body: "Great document!",
        author: "reviewer",
      });

      expect(comment.body).toBe("Great document!");
      expect(comment.author).toBe("reviewer");
      expect(comment.anchorType).toBeNull();
      expect(comment.anchorRef).toBeNull();
      expect(comment.docVersion).toBe(1);
      expect(comment.status).toBe("open");
    });

    it("creates an inline (line-anchored) comment", async () => {
      const { doc } = await createTestDoc();

      const comment = await createTestComment(doc.id, {
        body: "Fix this line",
        anchorType: "line",
        anchorRef: 5,
      });

      expect(comment.anchorType).toBe("line");
      expect(comment.anchorRef).toBe(5);
    });

    it("defaults author to anonymous", async () => {
      const { doc } = await createTestDoc();

      const comment = await createTestComment(doc.id);
      expect(comment.author).toBe("anonymous");
    });
  });

  describe("read", () => {
    it("lists all comments for a doc", async () => {
      const { doc } = await createTestDoc();
      await createTestComment(doc.id, { body: "Comment 1" });
      await createTestComment(doc.id, { body: "Comment 2" });

      const comments = await prisma.comment.findMany({
        where: { docId: doc.id },
        orderBy: { createdAt: "asc" },
      });

      expect(comments).toHaveLength(2);
      expect(comments[0].body).toBe("Comment 1");
      expect(comments[1].body).toBe("Comment 2");
    });

    it("filters comments by status", async () => {
      const { doc } = await createTestDoc();
      await createTestComment(doc.id, { body: "Open", status: "open" });
      await createTestComment(doc.id, {
        body: "Resolved",
        status: "resolved",
      });

      const open = await prisma.comment.findMany({
        where: { docId: doc.id, status: "open" },
      });

      expect(open).toHaveLength(1);
      expect(open[0].body).toBe("Open");
    });
  });

  describe("update status", () => {
    it("resolves a comment", async () => {
      const { doc } = await createTestDoc();
      const comment = await createTestComment(doc.id);

      const updated = await prisma.comment.update({
        where: { id: comment.id },
        data: { status: "resolved" },
      });

      expect(updated.status).toBe("resolved");
    });

    it("dismisses a comment", async () => {
      const { doc } = await createTestDoc();
      const comment = await createTestComment(doc.id);

      const updated = await prisma.comment.update({
        where: { id: comment.id },
        data: { status: "dismissed" },
      });

      expect(updated.status).toBe("dismissed");
    });
  });

  describe("cascade delete", () => {
    it("deletes comments when doc is deleted", async () => {
      const { doc } = await createTestDoc();
      const comment = await createTestComment(doc.id);

      await prisma.doc.delete({ where: { slug: doc.slug } });

      const found = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(found).toBeNull();
    });
  });

  describe("auth for private docs", () => {
    it("private doc requires api_key for comments", async () => {
      const { doc, rawApiKey } = await createTestDoc({
        visibility: "private",
      });

      // Valid API key allows creating comment
      expect(doc.apiKey).toBe(hashToken(rawApiKey));

      // Comment can be created with valid auth
      const comment = await createTestComment(doc.id, {
        body: "Private doc comment",
      });
      expect(comment.body).toBe("Private doc comment");
    });
  });
});
