import { describe, it, expect } from "vitest";
import {
  generateMagicToken,
  generateApiKey,
  generateShareToken,
  hashToken,
} from "@/lib/tokens";

describe("generateMagicToken", () => {
  it("starts with tok_ prefix", () => {
    expect(generateMagicToken()).toMatch(/^tok_/);
  });

  it("generates unique tokens", () => {
    const a = generateMagicToken();
    const b = generateMagicToken();
    expect(a).not.toBe(b);
  });
});

describe("generateApiKey", () => {
  it("starts with key_ prefix", () => {
    expect(generateApiKey()).toMatch(/^key_/);
  });
});

describe("generateShareToken", () => {
  it("starts with share_ prefix", () => {
    expect(generateShareToken()).toMatch(/^share_/);
  });

  it("generates unique tokens", () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
  });

  it("is distinct from magic tokens and api keys", () => {
    const share = generateShareToken();
    const magic = generateMagicToken();
    const api = generateApiKey();
    expect(share.startsWith("share_")).toBe(true);
    expect(magic.startsWith("tok_")).toBe(true);
    expect(api.startsWith("key_")).toBe(true);
  });
});

describe("hashToken", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashToken("tok_test123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic", () => {
    const a = hashToken("tok_test123");
    const b = hashToken("tok_test123");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = hashToken("tok_aaa");
    const b = hashToken("tok_bbb");
    expect(a).not.toBe(b);
  });
});
