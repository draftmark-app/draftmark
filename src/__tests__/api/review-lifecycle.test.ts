import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

async function createTestDoc(
  overrides: {
    visibility?: string;
    status?: string;
    expectedReviews?: number | null;
    reviewDeadline?: Date | null;
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
      content: "# Test\n\nHello world",
      visibility: overrides.visibility ?? "public",
      status: overrides.status ?? "open",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      expectedReviews: overrides.expectedReviews ?? null,
      reviewDeadline: overrides.reviewDeadline ?? null,
      meta: overrides.meta ?? undefined,
      versions: {
        create: { content: "# Test\n\nHello world", versionNumber: 1 },
      },
    },
  });

  return { doc, rawMagicToken, rawApiKey };
}

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

describe("Review Lifecycle", () => {
  describe("POST /docs — review settings", () => {
    it("creates a doc with expected_reviews and review_deadline", async () => {
      const deadline = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(`${BASE_URL}/api/v1/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Plan",
          expected_reviews: 3,
          review_deadline: deadline,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();

      // Fetch the doc to verify
      const getRes = await fetch(`${BASE_URL}/api/v1/docs/${data.slug}`);
      const doc = await getRes.json();
      expect(doc.expected_reviews).toBe(3);
      expect(doc.review_deadline).toBeTruthy();
      expect(doc.status).toBe("open");
      expect(doc.review_complete).toBe(false);
      expect(doc.review_expired).toBe(false);
      expect(doc.accepting_feedback).toBe(true);
    });

    it("creates a doc with meta field", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Plan",
          meta: { agent: "claude-code", source_file: "docs/plan.md" },
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();

      // meta is owner-only, so use magic_token to access it
      const getRes = await fetch(`${BASE_URL}/api/v1/docs/${data.slug}?token=${data.magic_token}`);
      const doc = await getRes.json();
      expect(doc.meta).toEqual({ agent: "claude-code", source_file: "docs/plan.md" });
    });

    it("rejects invalid expected_reviews", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "# Plan", expected_reviews: -1 }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /docs/:slug — computed fields", () => {
    it("returns review_complete: true when threshold met", async () => {
      const { doc } = await createTestDoc({ expectedReviews: 1 });

      // Add a review
      await prisma.review.create({
        data: { docId: doc.id, reviewerName: "alice", identifier: "abc" },
      });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`);
      const data = await res.json();
      expect(data.review_complete).toBe(true);
      expect(data.accepting_feedback).toBe(true); // threshold doesn't auto-close
    });

    it("returns review_expired: true when deadline passed", async () => {
      const { doc } = await createTestDoc({
        reviewDeadline: new Date(Date.now() - 1000), // 1 second ago
      });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`);
      const data = await res.json();
      expect(data.review_expired).toBe(true);
      expect(data.accepting_feedback).toBe(false);
    });
  });

  describe("PATCH /docs/:slug — close review", () => {
    it("closes a review via status update", async () => {
      const { doc, rawMagicToken } = await createTestDoc();

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Magic-Token": rawMagicToken,
        },
        body: JSON.stringify({ status: "review_closed" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("review_closed");
    });

    it("updates expected_reviews and review_deadline", async () => {
      const { doc, rawMagicToken } = await createTestDoc();
      const deadline = new Date(Date.now() + 86400000).toISOString();

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Magic-Token": rawMagicToken,
        },
        body: JSON.stringify({ expected_reviews: 5, review_deadline: deadline }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.expected_reviews).toBe(5);
      expect(data.review_deadline).toBeTruthy();
    });

    it("rejects invalid status", async () => {
      const { doc, rawMagicToken } = await createTestDoc();

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Magic-Token": rawMagicToken,
        },
        body: JSON.stringify({ status: "invalid" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("feedback gates — 409 when not accepting", () => {
    it("rejects comments on review_closed doc", async () => {
      const { doc } = await createTestDoc({ status: "review_closed" });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "A comment" }),
      });

      expect(res.status).toBe(409);
    });

    it("rejects reactions on review_closed doc", async () => {
      const { doc } = await createTestDoc({ status: "review_closed" });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: "thumbs_up", identifier: "test123" }),
      });

      expect(res.status).toBe(409);
    });

    it("rejects reviews on review_closed doc", async () => {
      const { doc } = await createTestDoc({ status: "review_closed" });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "test123" }),
      });

      expect(res.status).toBe(409);
    });

    it("rejects comments on expired doc", async () => {
      const { doc } = await createTestDoc({
        reviewDeadline: new Date(Date.now() - 1000),
      });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Too late" }),
      });

      expect(res.status).toBe(409);
    });

    it("allows comments on open doc with future deadline", async () => {
      const { doc } = await createTestDoc({
        reviewDeadline: new Date(Date.now() + 86400000),
      });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Still open!" }),
      });

      expect(res.status).toBe(201);
    });

    it("allows reading comments on closed doc", async () => {
      const { doc } = await createTestDoc({ status: "review_closed" });

      const res = await fetch(`${BASE_URL}/api/v1/docs/${doc.slug}/comments`);
      expect(res.status).toBe(200);
    });
  });
});
