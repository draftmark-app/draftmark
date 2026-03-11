import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import {
  generateMagicToken,
  generateApiKey,
  generateLoginToken,
  generateAccountApiKey,
  hashToken,
} from "@/lib/tokens";
import { createSessionToken } from "@/lib/session";

// Test helper: create a user and return session token
async function createTestUser(email = "test@example.com") {
  const user = await prisma.user.create({ data: { email } });
  const sessionToken = await createSessionToken(user.id);
  return { user, sessionToken };
}

// Test helper: create a user with an account API key
async function createTestUserWithApiKey(email = "test@example.com") {
  const user = await prisma.user.create({ data: { email } });
  const rawKey = generateAccountApiKey();
  await prisma.accountApiKey.create({
    data: {
      userId: user.id,
      name: "test-key",
      key: hashToken(rawKey),
    },
  });
  return { user, accountApiKey: rawKey };
}

// Test helper: create a doc owned by a user
async function createUserDoc(
  userId: string,
  overrides: { visibility?: string } = {}
) {
  const slug = generateSlug();
  const rawMagicToken = generateMagicToken();
  const rawApiKey = generateApiKey();
  const doc = await prisma.doc.create({
    data: {
      slug,
      title: "User Doc",
      content: "# Test\n\nHello",
      visibility: overrides.visibility ?? "public",
      magicToken: hashToken(rawMagicToken),
      apiKey: hashToken(rawApiKey),
      userId,
      versions: {
        create: { content: "# Test\n\nHello", versionNumber: 1 },
      },
    },
  });
  return { doc, rawMagicToken, rawApiKey };
}

const BASE = process.env.TEST_BASE_URL || "http://localhost:3333";

describe("User Accounts", () => {
  describe("POST /api/auth/login", () => {
    it("sends magic link for valid email", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "login@test.com" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // User should be created
      const user = await prisma.user.findUnique({
        where: { email: "login@test.com" },
      });
      expect(user).not.toBeNull();

      // Login token should be created
      const tokens = await prisma.loginToken.findMany({
        where: { userId: user!.id },
      });
      expect(tokens.length).toBe(1);
    });

    it("rejects invalid email", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects missing email", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/verify", () => {
    it("verifies valid login token and redirects", async () => {
      const user = await prisma.user.create({
        data: { email: "verify@test.com" },
      });
      const rawToken = generateLoginToken();
      await prisma.loginToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const res = await fetch(
        `${BASE}/api/auth/verify?token=${encodeURIComponent(rawToken)}`,
        { redirect: "manual" }
      );
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");

      // Token should be marked as used
      const token = await prisma.loginToken.findFirst({
        where: { userId: user.id },
      });
      expect(token!.usedAt).not.toBeNull();
    });

    it("rejects expired token", async () => {
      const user = await prisma.user.create({
        data: { email: "expired@test.com" },
      });
      const rawToken = generateLoginToken();
      await prisma.loginToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          expiresAt: new Date(Date.now() - 1000), // expired
        },
      });

      const res = await fetch(
        `${BASE}/api/auth/verify?token=${encodeURIComponent(rawToken)}`,
        { redirect: "manual" }
      );
      expect(res.status).toBe(401);
    });

    it("rejects already-used token", async () => {
      const user = await prisma.user.create({
        data: { email: "used@test.com" },
      });
      const rawToken = generateLoginToken();
      await prisma.loginToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          usedAt: new Date(),
        },
      });

      const res = await fetch(
        `${BASE}/api/auth/verify?token=${encodeURIComponent(rawToken)}`,
        { redirect: "manual" }
      );
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns null when not authenticated", async () => {
      const res = await fetch(`${BASE}/api/auth/me`);
      const data = await res.json();
      expect(data.user).toBeNull();
    });
  });

  describe("Private doc gating", () => {
    it("allows creating public doc without auth", async () => {
      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "# Public doc" }),
      });
      expect(res.status).toBe(201);
    });

    it("rejects creating private doc without auth", async () => {
      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# Private doc",
          visibility: "private",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("allows creating private doc with account API key", async () => {
      const { accountApiKey } = await createTestUserWithApiKey(
        "private-creator@test.com"
      );

      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accountApiKey}`,
        },
        body: JSON.stringify({
          content: "# Private doc",
          visibility: "private",
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();

      // Doc should be associated with user
      const doc = await prisma.doc.findUnique({
        where: { slug: data.slug },
      });
      expect(doc!.userId).not.toBeNull();
    });
  });

  describe("Account ownership on docs", () => {
    it("allows owner to GET private doc via account API key", async () => {
      const { user, accountApiKey } = await createTestUserWithApiKey(
        "owner-get@test.com"
      );
      const { doc } = await createUserDoc(user.id, {
        visibility: "private",
      });

      const res = await fetch(`${BASE}/api/v1/docs/${doc.slug}`, {
        headers: { Authorization: `Bearer ${accountApiKey}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      // Account owner should see owner-only fields
      expect(data).toHaveProperty("views_count");
      expect(data).toHaveProperty("meta");
    });

    it("allows owner to PATCH doc via account API key", async () => {
      const { user, accountApiKey } = await createTestUserWithApiKey(
        "owner-patch@test.com"
      );
      const { doc } = await createUserDoc(user.id);

      const res = await fetch(`${BASE}/api/v1/docs/${doc.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accountApiKey}`,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("Updated Title");
    });

    it("allows owner to DELETE doc via account API key", async () => {
      const { user, accountApiKey } = await createTestUserWithApiKey(
        "owner-delete@test.com"
      );
      const { doc } = await createUserDoc(user.id);

      const res = await fetch(`${BASE}/api/v1/docs/${doc.slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accountApiKey}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.deleted).toBe(true);
    });

    it("rejects non-owner from PATCHing doc via account API key", async () => {
      const { user } = await createTestUser("doc-owner@test.com");
      const { doc } = await createUserDoc(user.id);

      const { accountApiKey: otherKey } = await createTestUserWithApiKey(
        "other-user@test.com"
      );

      const res = await fetch(`${BASE}/api/v1/docs/${doc.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherKey}`,
        },
        body: JSON.stringify({ title: "Hacked" }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("Account API keys management", () => {
    it("creates and lists account API keys", async () => {
      const { accountApiKey } = await createTestUserWithApiKey(
        "keys-mgmt@test.com"
      );

      // List keys
      const res = await fetch(`${BASE}/api/v1/account/api-keys`, {
        headers: { Authorization: `Bearer ${accountApiKey}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.api_keys.length).toBeGreaterThanOrEqual(1);
    });

    it("creates a new account API key", async () => {
      const { accountApiKey } = await createTestUserWithApiKey(
        "keys-create@test.com"
      );

      const res = await fetch(`${BASE}/api/v1/account/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accountApiKey}`,
        },
        body: JSON.stringify({ name: "my-agent" }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.api_key).toMatch(/^acct_/);
      expect(data.name).toBe("my-agent");
    });

    it("revokes an account API key", async () => {
      const { user, accountApiKey } = await createTestUserWithApiKey(
        "keys-revoke@test.com"
      );

      // Create a second key to revoke
      const secondRaw = generateAccountApiKey();
      const secondKey = await prisma.accountApiKey.create({
        data: {
          userId: user.id,
          name: "to-revoke",
          key: hashToken(secondRaw),
        },
      });

      const res = await fetch(
        `${BASE}/api/v1/account/api-keys/${secondKey.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accountApiKey}` },
        }
      );
      expect(res.status).toBe(200);
      expect((await res.json()).deleted).toBe(true);
    });

    it("rejects unauthenticated API key management", async () => {
      const res = await fetch(`${BASE}/api/v1/account/api-keys`);
      expect(res.status).toBe(401);
    });
  });

  describe("Account docs list", () => {
    it("lists user docs via account API key", async () => {
      const { user, accountApiKey } = await createTestUserWithApiKey(
        "docs-list@test.com"
      );
      await createUserDoc(user.id, { visibility: "public" });
      await createUserDoc(user.id, { visibility: "private" });

      const res = await fetch(`${BASE}/api/v1/account/docs`, {
        headers: { Authorization: `Bearer ${accountApiKey}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.docs.length).toBe(2);
    });

    it("rejects unauthenticated docs list", async () => {
      const res = await fetch(`${BASE}/api/v1/account/docs`);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/account/register", () => {
    it("creates account and returns API key immediately", async () => {
      const res = await fetch(`${BASE}/api/v1/account/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "agent@test.com" }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.api_key).toMatch(/^acct_/);
      expect(data.email).toBe("agent@test.com");
      expect(data.verified).toBe(false);

      // User should exist but be unverified
      const user = await prisma.user.findUnique({
        where: { email: "agent@test.com" },
      });
      expect(user).not.toBeNull();
      expect(user!.emailVerifiedAt).toBeNull();

      // Login token should be created for verification
      const tokens = await prisma.loginToken.findMany({
        where: { userId: user!.id },
      });
      expect(tokens.length).toBe(1);
    });

    it("rejects duplicate email", async () => {
      await prisma.user.create({ data: { email: "dupe@test.com" } });

      const res = await fetch(`${BASE}/api/v1/account/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dupe@test.com" }),
      });
      expect(res.status).toBe(409);
    });

    it("returned key can create private docs within grace period", async () => {
      const regRes = await fetch(`${BASE}/api/v1/account/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "agent-private@test.com" }),
      });
      const { api_key } = await regRes.json();

      const docRes = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_key}`,
        },
        body: JSON.stringify({
          content: "# Private agent doc",
          visibility: "private",
        }),
      });
      expect(docRes.status).toBe(201);
    });

    it("returned key can always create public docs", async () => {
      const regRes = await fetch(`${BASE}/api/v1/account/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "agent-public@test.com" }),
      });
      const { api_key } = await regRes.json();

      const docRes = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_key}`,
        },
        body: JSON.stringify({ content: "# Public agent doc" }),
      });
      expect(docRes.status).toBe(201);
    });
  });

  describe("Email verification suspension", () => {
    it("blocks private doc creation for unverified accounts >24h old", async () => {
      // Create user manually with createdAt in the past
      const user = await prisma.user.create({
        data: {
          email: "expired-unverified@test.com",
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
        },
      });
      const rawKey = generateAccountApiKey();
      await prisma.accountApiKey.create({
        data: { userId: user.id, name: "test", key: hashToken(rawKey) },
      });

      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawKey}`,
        },
        body: JSON.stringify({
          content: "# Should fail",
          visibility: "private",
        }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("verification");
    });

    it("allows public doc creation for unverified accounts >24h old", async () => {
      const user = await prisma.user.create({
        data: {
          email: "expired-public@test.com",
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        },
      });
      const rawKey = generateAccountApiKey();
      await prisma.accountApiKey.create({
        data: { userId: user.id, name: "test", key: hashToken(rawKey) },
      });

      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawKey}`,
        },
        body: JSON.stringify({ content: "# Still works" }),
      });
      expect(res.status).toBe(201);
    });

    it("blocks private doc GET for suspended account owner", async () => {
      const user = await prisma.user.create({
        data: {
          email: "suspended-get@test.com",
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        },
      });
      const rawKey = generateAccountApiKey();
      await prisma.accountApiKey.create({
        data: { userId: user.id, name: "test", key: hashToken(rawKey) },
      });
      const { doc } = await createUserDoc(user.id, { visibility: "private" });

      const res = await fetch(`${BASE}/api/v1/docs/${doc.slug}`, {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      expect(res.status).toBe(403);
    });

    it("verified account has full access forever", async () => {
      const user = await prisma.user.create({
        data: {
          email: "verified-forever@test.com",
          emailVerifiedAt: new Date(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      });
      const rawKey = generateAccountApiKey();
      await prisma.accountApiKey.create({
        data: { userId: user.id, name: "test", key: hashToken(rawKey) },
      });

      const res = await fetch(`${BASE}/api/v1/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawKey}`,
        },
        body: JSON.stringify({
          content: "# Verified",
          visibility: "private",
        }),
      });
      expect(res.status).toBe(201);
    });
  });
});
