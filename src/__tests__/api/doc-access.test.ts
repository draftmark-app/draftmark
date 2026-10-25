import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import {
  generateMagicToken,
  generateApiKey,
  generateAccountApiKey,
  generateShareToken,
  hashToken,
} from "@/lib/tokens";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";

async function createDoc(
  overrides: {
    visibility?: string;
    shareToken?: string | null;
    userId?: string | null;
    meta?: Record<string, string>;
  } = {}
) {
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();

  const doc = await prisma.doc.create({
    data: {
      slug: generateSlug(),
      title: "Access Doc",
      content: "# Access Doc\n\nPrivate body",
      visibility: overrides.visibility ?? "private",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      shareToken: overrides.shareToken ?? null,
      userId: overrides.userId ?? null,
      meta: overrides.meta ?? undefined,
    },
  });

  return { doc, rawMagicToken, rawApiKey };
}

function getDoc(slug: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE_URL}/api/v1/docs/${slug}`, { headers });
}

describe("GET /docs/:slug access paths", () => {
  it("allows anonymous reads of public docs", async () => {
    const { doc } = await createDoc({ visibility: "public" });

    const res = await getDoc(doc.slug);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("# Access Doc\n\nPrivate body");
  });

  it("rejects private docs without a credential", async () => {
    const { doc } = await createDoc();

    const res = await getDoc(doc.slug);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("private");
    expect(data.content).toBeUndefined();
  });

  it("rejects private docs with a wrong magic token", async () => {
    const { doc } = await createDoc();

    const res = await getDoc(doc.slug, { "x-magic-token": "tok_wrong" });
    expect(res.status).toBe(401);
  });

  it("allows the magic token via ?token=", async () => {
    const { doc, rawMagicToken } = await createDoc();

    const res = await fetch(
      `${BASE_URL}/api/v1/docs/${doc.slug}?token=${rawMagicToken}`
    );
    expect(res.status).toBe(200);
  });

  it("allows the magic token via the X-Magic-Token header", async () => {
    const { doc, rawMagicToken } = await createDoc();

    const res = await getDoc(doc.slug, { "x-magic-token": rawMagicToken });
    expect(res.status).toBe(200);
  });

  it("allows the magic token via the per-doc cookie", async () => {
    const { doc, rawMagicToken } = await createDoc();

    const res = await getDoc(doc.slug, {
      cookie: `dm_tok_${doc.slug}=${rawMagicToken}`,
    });
    expect(res.status).toBe(200);
  });

  it("allows the doc API key", async () => {
    const { doc, rawApiKey } = await createDoc();

    const res = await getDoc(doc.slug, {
      authorization: `Bearer ${rawApiKey}`,
    });
    expect(res.status).toBe(200);
  });

  it("allows a share token via ?share_token=", async () => {
    const shareToken = generateShareToken();
    const { doc } = await createDoc({ shareToken });

    const res = await fetch(
      `${BASE_URL}/api/v1/docs/${doc.slug}?share_token=${shareToken}`
    );
    expect(res.status).toBe(200);
  });

  it("allows a share token via ?token=share_...", async () => {
    const shareToken = generateShareToken();
    const { doc } = await createDoc({ shareToken });

    const res = await fetch(
      `${BASE_URL}/api/v1/docs/${doc.slug}?token=${shareToken}`
    );
    expect(res.status).toBe(200);
  });

  it("allows an account API key owned doc", async () => {
    const rawAcctKey = generateAccountApiKey();
    const user = await prisma.user.create({
      data: { email: `owner-${generateSlug()}@example.com` },
    });
    await prisma.accountApiKey.create({
      data: { userId: user.id, key: hashToken(rawAcctKey) },
    });
    const { doc } = await createDoc({ userId: user.id });

    const res = await getDoc(doc.slug, {
      authorization: `Bearer ${rawAcctKey}`,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("# Access Doc\n\nPrivate body");
  });

  it("treats a magic token as owner regardless of which source carries it", async () => {
    const { doc, rawMagicToken } = await createDoc({
      meta: { agent: "claude" },
    });

    // Regression: the header source used to be ignored for owner detection, so
    // owner-only fields were hidden even with a valid token.
    const res = await getDoc(doc.slug, { "x-magic-token": rawMagicToken });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meta).toEqual({ agent: "claude" });
    expect(data.views_count).toBeDefined();
  });

  it("does not expose owner-only fields to share-token readers", async () => {
    const shareToken = generateShareToken();
    const { doc } = await createDoc({ shareToken, meta: { agent: "claude" } });

    const res = await fetch(
      `${BASE_URL}/api/v1/docs/${doc.slug}?share_token=${shareToken}`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meta).toBeUndefined();
    expect(data.views_count).toBeUndefined();
  });
});
