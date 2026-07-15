import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

async function createTestDoc() {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();
  const doc = await prisma.doc.create({
    data: {
      slug,
      title: "Test Doc",
      content: "# Test\n\nHello world",
      visibility: "public",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
    },
  });
  return { doc, rawMagicToken, rawApiKey };
}

async function addComment(slug: string) {
  const res = await fetch(`${BASE_URL}/api/v1/docs/${slug}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "please fix this" }),
  });
  return (await res.json()).id as string;
}

function patchStatus(
  slug: string,
  id: string,
  status: string,
  auth: { token?: string; apiKey?: string } = {}
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.apiKey) headers["Authorization"] = `Bearer ${auth.apiKey}`;
  const query = auth.token ? `?token=${encodeURIComponent(auth.token)}` : "";
  return fetch(`${BASE_URL}/api/v1/docs/${slug}/comments/${id}${query}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });
}

describe("PATCH /docs/:slug/comments/:id (status)", () => {
  it("resolves a comment with the doc API key (CLI path)", async () => {
    const { doc, rawApiKey } = await createTestDoc();
    const id = await addComment(doc.slug);

    const res = await patchStatus(doc.slug, id, "resolved", { apiKey: rawApiKey });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("resolved");
  });

  it("resolves a comment with the magic token (web owner path)", async () => {
    const { doc, rawMagicToken } = await createTestDoc();
    const id = await addComment(doc.slug);

    const res = await patchStatus(doc.slug, id, "resolved", { token: rawMagicToken });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("resolved");
  });

  it("dismisses and then reopens a comment", async () => {
    const { doc, rawMagicToken } = await createTestDoc();
    const id = await addComment(doc.slug);

    const dismissed = await patchStatus(doc.slug, id, "dismissed", { token: rawMagicToken });
    expect((await dismissed.json()).status).toBe("dismissed");

    const reopened = await patchStatus(doc.slug, id, "open", { token: rawMagicToken });
    expect(reopened.status).toBe(200);
    expect((await reopened.json()).status).toBe("open");
  });

  it("rejects an invalid status", async () => {
    const { doc, rawMagicToken } = await createTestDoc();
    const id = await addComment(doc.slug);

    const res = await patchStatus(doc.slug, id, "done", { token: rawMagicToken });
    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated caller", async () => {
    const { doc } = await createTestDoc();
    const id = await addComment(doc.slug);

    const res = await patchStatus(doc.slug, id, "resolved");
    expect(res.status).toBe(401);
  });

  it("rejects a wrong magic token", async () => {
    const { doc } = await createTestDoc();
    const id = await addComment(doc.slug);

    const res = await patchStatus(doc.slug, id, "resolved", { token: generateMagicToken() });
    expect(res.status).toBe(403);
  });
});
